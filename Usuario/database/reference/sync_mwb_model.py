"""Create a current Workbench model copy from the supplied base model."""

from copy import deepcopy
from pathlib import Path
from uuid import uuid4
from zipfile import ZIP_DEFLATED, ZipFile
import xml.etree.ElementTree as ET


ROOT = Path(__file__).parent
SOURCE = ROOT / "Modelo_Logico_EcoWayer_base.mwb"
TARGET = ROOT / "Modelo_Logico_EcoWayer_integrado.mwb"


def child_with_key(element, key):
    return next(
        child for child in list(element)
        if child.tag == "value" and child.get("key") == key
    )


def value(element, key):
    child = child_with_key(element, key)
    return child.text or ""


def set_value(element, key, content):
    child_with_key(element, key).text = str(content)


def table_name(table):
    return value(table, "name")


def new_object_id():
    return str(uuid4()).upper()


def new_pointer():
    return uuid4().hex[:16].upper()


def set_link(element, key, target_id):
    link = next(child for child in list(element) if child.tag == "link" and child.get("key") == key)
    set_reference(link, target_id)


def set_link_by_key(element, key, target_id):
    link = next(child for child in list(element) if child.tag == "link" and child.get("key") == key)
    set_reference(link, target_id)


def set_reference(link, target_id):
    target = target_id.strip("{}")
    link.text = f"{{{target}}}" if (link.text or "").startswith("{") else target


def reset_ids_and_pointers(element):
    for node in element.iter():
        if node.get("id"):
            old_id = node.get("id")
            new_id = new_object_id()
            node.set("id", f"{{{new_id}}}" if old_id.startswith("{") else new_id)
        if node.get("_ptr_"):
            node.set("_ptr_", new_pointer())


def set_column(column, definition, owner_id):
    name, datatype, length, precision, scale, required, default, auto_increment = definition
    set_value(column, "name", name)
    set_value(column, "oldName", "")
    set_value(column, "autoIncrement", 1 if auto_increment else 0)
    set_value(column, "isNotNull", 1 if required else 0)
    set_value(column, "length", length)
    set_value(column, "precision", precision)
    set_value(column, "scale", scale)
    set_value(column, "defaultValue", default or "")
    set_value(column, "defaultValueIsNull", 0)

    type_link = next(
        child for child in list(column)
        if child.tag == "link" and child.get("key") == "simpleType"
    )
    type_link.text = f"com.mysql.rdbms.mysql.datatype.{datatype}"
    set_link_by_key(column, "owner", owner_id)


def main():
    with ZipFile(SOURCE) as archive:
        members = {name: archive.read(name) for name in archive.namelist()}

    root = ET.fromstring(members["document.mwb.xml"])
    tables = [node for node in root.iter("value") if node.get("struct-name") == "db.mysql.Table"]
    schema = next(
        node for node in root.iter("value")
        if node.get("struct-name") == "db.mysql.Schema"
    )
    schema_id = schema.get("id")
    by_name = {table_name(table): table for table in tables}

    # Fix the names that differed from the supplied DDL.
    renames = {
        "tbl_alertas_mensagens": "tbl_alertas_mensagem",
        "tbl_pontocoleta_materialaceito": "tbl_ponto_coleta_material_aceito",
    }
    for old_name, new_name in renames.items():
        set_value(by_name[old_name], "name", new_name)
        by_name[new_name] = by_name.pop(old_name)

    # Align pluralized legacy columns with the names in the SQL schema.
    for table_name_value, old_column, new_column in [
        ("tbl_alertas_anuncio", "id_alertas", "id_alerta"),
        ("tbl_alertas_mensagem", "id_alertas", "id_alerta"),
        ("tbl_alertas_mensagem", "id_mensagens", "id_mensagem"),
    ]:
        for column in by_name[table_name_value].iter("value"):
            if column.get("struct-name") == "db.mysql.Column" and value(column, "name") == old_column:
                set_value(column, "name", new_column)

    # Remove a stale relationship column that does not exist in the supplied DDL.
    stale_table = by_name["tbl_alertas_mensagem"]
    stale_column = next(
        column for column in child_with_key(stale_table, "columns")
        if column.get("struct-name") == "db.mysql.Column" and value(column, "name") == "tbl_entrega_id"
    )
    stale_column_id = stale_column.get("id")
    child_with_key(stale_table, "columns").remove(stale_column)
    for collection_name in ("foreignKeys", "indices"):
        collection = child_with_key(stale_table, collection_name)
        for item in list(collection):
            referenced_ids = {
                (link.text or "").strip("{}")
                for link in item.iter("link")
                if link.get("key") in ("referencedColumn", None)
            }
            if stale_column_id in referenced_ids:
                collection.remove(item)

    address = by_name["tbl_endereco"]
    for column in address.iter("value"):
        if column.get("struct-name") == "db.mysql.Column" and value(column, "name") == "id_externa":
            set_value(column, "name", "id_externo")

    alert_ad = by_name["tbl_alertas_anuncio"]
    for column in alert_ad.iter("value"):
        if column.get("struct-name") == "db.mysql.Column" and value(column, "name") == "id_alertas":
            set_value(column, "name", "id_alerta")

    # Templates are copied from existing columns so Workbench keeps its own metadata.
    column_templates = {}
    for table in tables:
        for column in table.iter("value"):
            if column.get("struct-name") != "db.mysql.Column":
                continue
            simple_type = next(
                child.text.rsplit(".", 1)[-1]
                for child in list(column)
                if child.tag == "link" and child.get("key") == "simpleType"
            )
            column_templates.setdefault(simple_type, column)

    type_aliases = {
        "integer": "int",
        "boolean": "tinyint",
        "timestamp": "datetime",
    }

    def make_column(definition, owner_id):
        _, datatype, *_ = definition
        template_type = type_aliases.get(datatype, datatype)
        if template_type not in column_templates:
            template_type = "varchar"
        column = deepcopy(column_templates[template_type])
        reset_ids_and_pointers(column)
        set_column(column, definition, owner_id)
        return column

    def add_columns(table, definitions):
        columns = child_with_key(table, "columns")
        owner_id = table.get("id")
        existing = {
            value(column, "name")
            for column in columns
            if column.get("struct-name") == "db.mysql.Column"
        }
        for definition in definitions:
            if definition[0] in existing:
                continue
            columns.append(make_column(definition, owner_id))
            existing.add(definition[0])

    # Add columns introduced by the API migrations.
    add_columns(address, [
        ("numero", "varchar", 10, -1, -1, True, "", False),
        ("id_externo", "varchar", 255, -1, -1, False, "", False),
        ("latitude", "decimal", -1, 10, 7, False, "", False),
        ("longitude", "decimal", -1, 10, 7, False, "", False),
    ])
    add_columns(by_name["tbl_usuario"], [
        ("senha_hash", "varchar", 255, -1, -1, False, "", False),
    ])
    add_columns(by_name["tbl_email"], [
        ("verificado", "tinyint", -1, -1, -1, True, "0", False),
    ])
    add_columns(by_name["tbl_telefone"], [
        ("verificado", "tinyint", -1, -1, -1, True, "0", False),
    ])
    add_columns(by_name["tbl_anuncio"], [
        ("valor", "decimal", -1, 10, 2, False, "", False),
    ])
    add_columns(by_name["tbl_qr_code"], [
        ("id_usuario_gerador", "int", -1, -1, -1, False, "", False),
    ])
    add_columns(by_name["tbl_entrega"], [
        ("id_negociacao", "int", -1, -1, -1, False, "", False),
    ])

    # Describe the base tables missing from the Workbench file and the API migrations.
    new_tables = {
        "tbl_denuncias_anuncio": [
            ("id", "int", -1, -1, -1, True, "", True),
            ("id_denuncias", "int", -1, -1, -1, True, "", False),
            ("id_anuncio", "int", -1, -1, -1, True, "", False),
        ],
        "tbl_alertas_mensagem": [
            ("id", "int", -1, -1, -1, True, "", True),
            ("id_alerta", "int", -1, -1, -1, True, "", False),
            ("id_mensagem", "int", -1, -1, -1, True, "", False),
        ],
        "tbl_ponto_coleta_material_aceito": [
            ("id", "int", -1, -1, -1, True, "", True),
            ("id_ponto_coleta", "int", -1, -1, -1, True, "", False),
            ("id_material_aceito", "int", -1, -1, -1, True, "", False),
        ],
        "tbl_codigo_usuario": [
            ("id", "int", -1, -1, -1, True, "", True),
            ("id_usuario", "int", -1, -1, -1, True, "", False),
            ("contato", "varchar", 255, -1, -1, True, "", False),
            ("codigo_hash", "varchar", 255, -1, -1, True, "", False),
            ("finalidade", "varchar", 24, -1, -1, True, "", False),
            ("expira_em", "datetime", -1, -1, -1, True, "", False),
            ("criado_em", "datetime", -1, -1, -1, True, "CURRENT_TIMESTAMP", False),
            ("tentativas", "int", -1, -1, -1, True, "0", False),
        ],
        "tbl_negociacao": [
            ("id", "int", -1, -1, -1, True, "", True),
            ("id_conversa", "int", -1, -1, -1, True, "", False),
            ("id_usuario", "int", -1, -1, -1, True, "", False),
            ("id_negociacao_pai", "int", -1, -1, -1, False, "", False),
            ("valor_ofertado", "decimal", -1, 10, 2, True, "", False),
            ("local_retirada", "varchar", 255, -1, -1, True, "", False),
            ("status", "varchar", 24, -1, -1, True, "pendente", False),
            ("criada_em", "datetime", -1, -1, -1, True, "CURRENT_TIMESTAMP", False),
            ("atualizada_em", "datetime", -1, -1, -1, True, "CURRENT_TIMESTAMP", False),
        ],
        "tbl_notificacao": [
            ("id", "int", -1, -1, -1, True, "", True),
            ("id_usuario", "int", -1, -1, -1, True, "", False),
            ("tipo", "varchar", 40, -1, -1, True, "", False),
            ("titulo", "varchar", 120, -1, -1, True, "", False),
            ("mensagem", "text", -1, -1, -1, True, "", False),
            ("dados", "json", -1, -1, -1, False, "", False),
            ("lida", "tinyint", -1, -1, -1, True, "0", False),
            ("criada_em", "datetime", -1, -1, -1, True, "CURRENT_TIMESTAMP", False),
        ],
        "tbl_denuncias_usuario": [
            ("id", "int", -1, -1, -1, True, "", True),
            ("id_denuncias", "int", -1, -1, -1, True, "", False),
            ("id_usuario", "int", -1, -1, -1, True, "", False),
        ],
        "tbl_catalogo_voucher": [
            ("id", "int", -1, -1, -1, True, "", True),
            ("nome_parceiro", "varchar", 150, -1, -1, True, "", False),
            ("beneficio", "varchar", 255, -1, -1, True, "", False),
            ("pontos_necessarios", "int", -1, -1, -1, True, "", False),
            ("validade_dias", "int", -1, -1, -1, True, "30", False),
            ("ativo", "tinyint", -1, -1, -1, True, "1", False),
            ("criado_em", "datetime", -1, -1, -1, True, "CURRENT_TIMESTAMP", False),
        ],
    }

    template_table = by_name["tbl_verificacao"]
    template_id_column = next(
        column for column in child_with_key(template_table, "columns")
        if column.get("struct-name") == "db.mysql.Column" and value(column, "name") == "id"
    )
    template_primary_index = next(
        index for index in child_with_key(template_table, "indices")
        if index.get("struct-name") == "db.mysql.Index" and value(index, "indexType") == "PRIMARY"
    )
    template_foreign_key = next(
        node for node in root.iter("value")
        if node.get("struct-name") == "db.mysql.ForeignKey"
    )
    template_foreign_index = next(
        index for index in child_with_key(by_name["tbl_email"], "indices")
        if index.get("struct-name") == "db.mysql.Index" and value(index, "indexType") != "PRIMARY"
    )

    for name, definitions in new_tables.items():
        if name in by_name:
            continue

        table = deepcopy(template_table)
        reset_ids_and_pointers(table)
        table_id = table.get("id")
        set_value(table, "name", name)
        set_value(table, "oldName", "")
        set_link(table, "owner", schema_id)

        column_list = child_with_key(table, "columns")
        for existing in list(column_list):
            column_list.remove(existing)
        id_column = deepcopy(template_id_column)
        reset_ids_and_pointers(id_column)
        set_column(id_column, definitions[0], table_id)
        column_list.append(id_column)
        for definition in definitions[1:]:
            column_list.append(make_column(definition, table_id))

        index_list = child_with_key(table, "indices")
        for existing in list(index_list):
            index_list.remove(existing)
        primary_index = deepcopy(template_primary_index)
        reset_ids_and_pointers(primary_index)
        primary_index_id = primary_index.get("id")
        primary_column = primary_index.find(".//link[@key='referencedColumn']")
        primary_column.text = id_column.get("id")
        set_link(primary_index, "owner", table_id)
        index_column = next(
            node for node in primary_index.iter("value")
            if node.get("struct-name") == "db.mysql.IndexColumn"
        )
        set_link(index_column, "owner", primary_index_id)
        index_list.append(primary_index)
        set_link(table, "primaryKey", primary_index_id)

        for key in ("foreignKeys", "triggers"):
            collection = child_with_key(table, key)
            for existing in list(collection):
                collection.remove(existing)

        child_with_key(schema, "tables").append(table)
        by_name[name] = table

    # Keep foreign-key links in the Workbench model aligned with the migrations.
    def find_column_id(table, name):
        matches = [
            column.get("id") for column in child_with_key(table, "columns")
            if column.get("struct-name") == "db.mysql.Column" and value(column, "name") == name
        ]
        if not matches:
            columns = [
                value(column, "name") for column in child_with_key(table, "columns")
                if column.get("struct-name") == "db.mysql.Column"
            ]
            raise ValueError(f"Coluna {table_name(table)}.{name} não existe. Colunas: {columns}")
        return matches[0]

    def add_foreign_key(source_name, source_column, target_name, target_column, delete_rule="NO ACTION"):
        source = by_name[source_name]
        target = by_name[target_name]
        source_column_id = find_column_id(source, source_column)
        target_column_id = find_column_id(target, target_column)

        index = deepcopy(template_foreign_index)
        reset_ids_and_pointers(index)
        index_id = index.get("id")
        set_value(index, "name", f"idx_{source_name}_{source_column}")
        set_value(index, "oldName", "")
        set_link(index, "owner", source.get("id"))
        index_ref = index.find(".//link[@key='referencedColumn']")
        set_reference(index_ref, source_column_id)
        index_column = next(node for node in index.iter("value") if node.get("struct-name") == "db.mysql.IndexColumn")
        set_link(index_column, "owner", index_id)
        child_with_key(source, "indices").append(index)

        foreign_key = deepcopy(template_foreign_key)
        reset_ids_and_pointers(foreign_key)
        set_value(foreign_key, "name", f"fk_{source_name}_{source_column}_{target_name}")
        set_value(foreign_key, "oldName", "")
        set_value(foreign_key, "deleteRule", delete_rule)
        set_link(foreign_key, "owner", source.get("id"))
        set_reference(foreign_key.find("./link[@key='referencedTable']"), target.get("id"))
        set_reference(foreign_key.find("./link[@key='index']"), index_id)

        source_links = child_with_key(foreign_key, "columns")
        source_link = next(node for node in source_links if node.tag == "link")
        set_reference(source_link, source_column_id)

        target_links = child_with_key(foreign_key, "referencedColumns")
        target_link = next(node for node in target_links if node.tag == "link")
        set_reference(target_link, target_column_id)
        child_with_key(source, "foreignKeys").append(foreign_key)

    relationships = [
        ("tbl_denuncias_anuncio", "id_denuncias", "tbl_denuncias", "id", "CASCADE"),
        ("tbl_denuncias_anuncio", "id_anuncio", "tbl_anuncio", "id", "NO ACTION"),
        ("tbl_alertas_mensagem", "id_alerta", "tbl_alertas", "id", "NO ACTION"),
        ("tbl_alertas_mensagem", "id_mensagem", "tbl_mensagens", "id", "NO ACTION"),
        ("tbl_ponto_coleta_material_aceito", "id_ponto_coleta", "tbl_ponto_coleta", "id", "NO ACTION"),
        ("tbl_ponto_coleta_material_aceito", "id_material_aceito", "tbl_material_aceito", "id", "NO ACTION"),
        ("tbl_codigo_usuario", "id_usuario", "tbl_usuario", "id", "CASCADE"),
        ("tbl_negociacao", "id_conversa", "tbl_conversa", "id", "CASCADE"),
        ("tbl_negociacao", "id_usuario", "tbl_usuario", "id", "NO ACTION"),
        ("tbl_negociacao", "id_negociacao_pai", "tbl_negociacao", "id", "NO ACTION"),
        ("tbl_notificacao", "id_usuario", "tbl_usuario", "id", "CASCADE"),
        ("tbl_denuncias_usuario", "id_denuncias", "tbl_denuncias", "id", "CASCADE"),
        ("tbl_denuncias_usuario", "id_usuario", "tbl_usuario", "id", "NO ACTION"),
        ("tbl_entrega", "id_negociacao", "tbl_negociacao", "id", "SET NULL"),
        ("tbl_qr_code", "id_usuario_gerador", "tbl_usuario", "id", "SET NULL"),
    ]
    for relationship in relationships:
        add_foreign_key(*relationship)

    members["document.mwb.xml"] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    with ZipFile(TARGET, "w", ZIP_DEFLATED) as archive:
        for name, content in members.items():
            archive.writestr(name, content)

    with ZipFile(TARGET) as archive:
        ET.fromstring(archive.read("document.mwb.xml"))

    print(f"Modelo integrado criado com {len(by_name)} tabelas: {TARGET.name}")


if __name__ == "__main__":
    main()
