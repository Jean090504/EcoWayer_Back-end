use ecowayer_db;

select
    nivel_impacto.id,
    nivel_impacto.nome as nome_nivel_impacto,
    nivel_impacto.numero as numero_nivel_impacto,
    nivel_impacto.meta as meta_nivel_impacto,
    nivel_impacto.unidade as unidade_nivel_impacto
from tbl_nivel_impacto as nivel_impacto;


select
    insignia.id,
    insignia.nome as nome_insignia,
    insignia.descricao as descricao_insignia,
    insignia.meta as meta_insignia,
    insignia.unidade as unidade_insignia
from tbl_insignia as insignia;


select
    genero.id,
    genero.nome as nome_genero,
    genero.sigla as sigla_genero
from tbl_genero as genero;


select
    verificacao.id,
    verificacao.tentativas as tentativas_verificacao,
    verificacao.tempo as tempo_verificacao,
    verificacao.reenvio as reenvio_verificacao,
    verificacao.bloqueio as bloqueio_verificacao,
    verificacao.ultimo_reenvio as ultimo_reenvio_verificacao
from tbl_verificacao as verificacao;


select
    status_usuario.id,
    status_usuario.status as status_usuario
from tbl_status_usuario as status_usuario;


select
    material_aceito.id,
    material_aceito.nome as nome_material_aceito,
    material_aceito.icone as icone_material_aceito
from tbl_material_aceito as material_aceito;


select
    endereco.id,
    endereco.cep as cep_endereco,
    endereco.rua as rua_endereco,
    endereco.numero as numero_endereco,
    endereco.complemento as complemento_endereco,
    endereco.bairro as bairro_endereco,
    endereco.cidade as cidade_endereco,
    endereco.estado as estado_endereco,
    endereco.sigla as sigla_endereco,
    endereco.id_externo as id_externo_endereco
from tbl_endereco as endereco;


select
    administrador.id,
    administrador.nome as nome_administrador,
    administrador.email as email_administrador,
    administrador.senha as senha_administrador
from tbl_administrador as administrador;


select
    tipo_categoria.id,
    tipo_categoria.nome as nome_tipo_categoria
from tbl_tipo_categoria as tipo_categoria;


select
    tipo_modalidade.id,
    tipo_modalidade.tipo as tipo_modalidade
from tbl_tipo_modalidade as tipo_modalidade;


select
    tipo_imagem.id,
    tipo_imagem.tipo as tipo_imagem
from tbl_tipo_imagem as tipo_imagem;


select
    condicao_item.id,
    condicao_item.nome as nome_condicao_item
from tbl_condicao_item as condicao_item;


select
    tipo_denuncias.id,
    tipo_denuncias.tipo as tipo_denuncia
from tbl_tipo_denuncias as tipo_denuncias;


select
    ia.id,
    ia.nome as nome_ia,
    ia.provedor as provedor_ia,
    ia.versao as versao_ia,
    ia.status as status_ia,
    ia.id_externo as id_externo_ia
from tbl_ia as ia;


select
    dataset.id,
    dataset.nome as nome_dataset,
    dataset.descricao as descricao_dataset
from tbl_dataset as dataset;


select
    qr_code.id,
    qr_code.codigo as codigo_qr_code,
    qr_code.data_criacao as data_criacao_qr_code,
    qr_code.data_expiracao as data_expiracao_qr_code,
    qr_code.status as status_qr_code
from tbl_qr_code as qr_code;


select
    categoria.id,
    categoria.nome as nome_categoria,
    categoria.pontos as pontos_categoria,
    tipo_categoria.nome as nome_tipo_categoria
from tbl_categoria as categoria
inner join tbl_tipo_categoria as tipo_categoria
    on categoria.id_tipo_categoria = tipo_categoria.id;


select
    modalidade.id,
    modalidade.nome as nome_modalidade,
    tipo_modalidade.tipo as tipo_modalidade
from tbl_modalidade as modalidade
inner join tbl_tipo_modalidade as tipo_modalidade
    on modalidade.id_tipo_modalidade = tipo_modalidade.id;


select
    imagem.id,
    imagem.url as url_imagem,
    tipo_imagem.tipo as tipo_imagem
from tbl_imagem as imagem
inner join tbl_tipo_imagem as tipo_imagem
    on imagem.id_tipo_imagem = tipo_imagem.id;


select
    usuario.id,
    usuario.nome as nome_usuario,
    usuario.cpf as cpf_usuario,
    usuario.data_nascimento as data_nascimento_usuario,
    imagem.url as url_imagem_usuario,
    genero.nome as nome_genero,
    status_usuario.status as status_usuario,
    nivel_impacto.nome as nome_nivel_impacto
from tbl_usuario as usuario
inner join tbl_imagem as imagem
    on usuario.id_imagem = imagem.id
inner join tbl_genero as genero
    on usuario.id_genero = genero.id
inner join tbl_status_usuario as status_usuario
    on usuario.id_status_usuario = status_usuario.id
inner join tbl_nivel_impacto as nivel_impacto
    on usuario.id_nivel_impacto = nivel_impacto.id;


select
    usuario_insignia.id,
    usuario.nome as nome_usuario,
    insignia.nome as nome_insignia,
    usuario_insignia.progresso as progresso_usuario_insignia,
    usuario_insignia.status as status_usuario_insignia
from tbl_usuario_insignia as usuario_insignia
inner join tbl_usuario as usuario
    on usuario_insignia.id_usuario = usuario.id
inner join tbl_insignia as insignia
    on usuario_insignia.id_insignia = insignia.id;


select
    email.id,
    email.email as email_usuario,
    email.codigo_verificacao as codigo_verificacao_email,
    usuario.nome as nome_usuario
from tbl_email as email
inner join tbl_usuario as usuario
    on email.id_usuario = usuario.id;


select
    telefone.id,
    telefone.numero as numero_telefone,
    telefone.codigo_verificacao as codigo_verificacao_telefone,
    usuario.nome as nome_usuario
from tbl_telefone as telefone
inner join tbl_usuario as usuario
    on telefone.id_usuario = usuario.id;


select
    email_verificacao.id,
    email.email as email_usuario,
    verificacao.id as id_verificacao,
    verificacao.tentativas as tentativas_verificacao,
    verificacao.tempo as tempo_verificacao,
    verificacao.reenvio as reenvio_verificacao,
    verificacao.bloqueio as bloqueio_verificacao,
    verificacao.ultimo_reenvio as ultimo_reenvio_verificacao
from tbl_email_verificacao as email_verificacao
inner join tbl_email as email
    on email_verificacao.id_email = email.id
inner join tbl_verificacao as verificacao
    on email_verificacao.id_verificacao = verificacao.id;


select
    telefone_verificacao.id,
    telefone.numero as numero_telefone,
    verificacao.id as id_verificacao,
    verificacao.tentativas as tentativas_verificacao,
    verificacao.tempo as tempo_verificacao,
    verificacao.reenvio as reenvio_verificacao,
    verificacao.bloqueio as bloqueio_verificacao,
    verificacao.ultimo_reenvio as ultimo_reenvio_verificacao
from tbl_telefone_verificacao as telefone_verificacao
inner join tbl_telefone as telefone
    on telefone_verificacao.id_telefone = telefone.id
inner join tbl_verificacao as verificacao
    on telefone_verificacao.id_verificacao = verificacao.id;


select
    conta.id,
    conta.senha as senha_conta,
    email.email as email_usuario,
    usuario.nome as nome_usuario
from tbl_conta as conta
inner join tbl_email as email
    on conta.id_email = email.id
inner join tbl_usuario as usuario
    on email.id_usuario = usuario.id;


select
    treinamento_ia.id,
    treinamento_ia.status as status_treinamento_ia,
    treinamento_ia.id_externo as id_externo_treinamento_ia,
    ia.nome as nome_ia,
    dataset.nome as nome_dataset
from tbl_treinamento_ia as treinamento_ia
inner join tbl_ia as ia
    on treinamento_ia.id_ia = ia.id
inner join tbl_dataset as dataset
    on treinamento_ia.id_dataset = dataset.id;


select
    anuncio.id,
    anuncio.nome as nome_anuncio,
    anuncio.descricao as descricao_anuncio,
    anuncio.data_publicacao as data_publicacao_anuncio,
    usuario.nome as nome_usuario,
    categoria.nome as nome_categoria,
    modalidade.nome as nome_modalidade,
    condicao_item.nome as nome_condicao_item
from tbl_anuncio as anuncio
inner join tbl_usuario as usuario
    on anuncio.id_usuario = usuario.id
inner join tbl_categoria as categoria
    on anuncio.id_categoria = categoria.id
inner join tbl_modalidade as modalidade
    on anuncio.id_modalidade = modalidade.id
inner join tbl_condicao_item as condicao_item
    on anuncio.id_condicao_item = condicao_item.id;


select
    imagem_anuncio.id,
    anuncio.nome as nome_anuncio,
    imagem.url as url_imagem
from tbl_imagem_anuncio as imagem_anuncio
inner join tbl_imagem as imagem
    on imagem_anuncio.id_imagem = imagem.id
inner join tbl_anuncio as anuncio
    on imagem_anuncio.id_anuncio = anuncio.id;


select
    pontos.id,
    pontos.qntd_pontos as quantidade_pontos,
    pontos.data_registro as data_registro_pontos,
    categoria.nome as nome_categoria,
    usuario.nome as nome_usuario
from tbl_pontos as pontos
inner join tbl_categoria as categoria
    on pontos.id_categoria = categoria.id
inner join tbl_usuario as usuario
    on pontos.id_usuario = usuario.id;


select
    historico_anuncio.id,
    anuncio.nome as nome_anuncio,
    historico_anuncio.status as status_historico_anuncio,
    historico_anuncio.data_alteracao as data_alteracao_anuncio,
    historico_anuncio.detalhes as detalhes_historico_anuncio
from tbl_historico_anuncio as historico_anuncio
inner join tbl_anuncio as anuncio
    on historico_anuncio.id_anuncio = anuncio.id;


select
    conversa.id,
    anuncio.nome as nome_anuncio,
    usuario.nome as nome_usuario
from tbl_conversa as conversa
inner join tbl_anuncio as anuncio
    on conversa.id_anuncio = anuncio.id
inner join tbl_usuario as usuario
    on conversa.id_usuario = usuario.id;


select
    mensagens.id,
    mensagens.texto as texto_mensagem,
    mensagens.envio as data_envio_mensagem,
    mensagens.lida as mensagem_lida,
    conversa.id as id_conversa,
    usuario.nome as nome_remetente
from tbl_mensagens as mensagens
inner join tbl_conversa as conversa
    on mensagens.id_conversa = conversa.id
inner join tbl_usuario as usuario
    on mensagens.id_remetente = usuario.id;


select
    denuncias.id,
    denuncias.descricao as descricao_denuncia,
    tipo_denuncias.tipo as tipo_denuncia,
    usuario.nome as nome_denunciante
from tbl_denuncias as denuncias
inner join tbl_tipo_denuncias as tipo_denuncias
    on denuncias.id_tipo_denuncias = tipo_denuncias.id
inner join tbl_usuario as usuario
    on denuncias.id_denunciante = usuario.id;


select
    imagem_denuncias.id,
    imagem.url as url_imagem,
    denuncias.id as id_denuncia,
    denuncias.descricao as descricao_denuncia
from tbl_imagem_denuncias as imagem_denuncias
inner join tbl_imagem as imagem
    on imagem_denuncias.id_imagem = imagem.id
inner join tbl_denuncias as denuncias
    on imagem_denuncias.id_denuncias = denuncias.id;


select
    denuncias_anuncio.id,
    denuncias.id as id_denuncia,
    denuncias.descricao as descricao_denuncia,
    anuncio.nome as nome_anuncio
from tbl_denuncias_anuncio as denuncias_anuncio
inner join tbl_denuncias as denuncias
    on denuncias_anuncio.id_denuncias = denuncias.id
inner join tbl_anuncio as anuncio
    on denuncias_anuncio.id_anuncio = anuncio.id;


select
    alertas.id,
    alertas.motivo as motivo_alerta,
    alertas.status as status_alerta,
    alertas.acao as acao_alerta,
    ia.nome as nome_ia,
    usuario.nome as nome_usuario_suspeito
from tbl_alertas as alertas
inner join tbl_ia as ia
    on alertas.id_ia = ia.id
inner join tbl_usuario as usuario
    on alertas.id_usuario = usuario.id;


select
    alertas_anuncio.id,
    alertas.id as id_alerta,
    alertas.motivo as motivo_alerta,
    anuncio.nome as nome_anuncio
from tbl_alertas_anuncio as alertas_anuncio
inner join tbl_alertas as alertas
    on alertas_anuncio.id_alerta = alertas.id
inner join tbl_anuncio as anuncio
    on alertas_anuncio.id_anuncio = anuncio.id;


select
    alertas_mensagem.id,
    alertas.id as id_alerta,
    alertas.motivo as motivo_alerta,
    mensagens.id as id_mensagem,
    mensagens.texto as texto_mensagem
from tbl_alertas_mensagem as alertas_mensagem
inner join tbl_alertas as alertas
    on alertas_mensagem.id_alerta = alertas.id
inner join tbl_mensagens as mensagens
    on alertas_mensagem.id_mensagem = mensagens.id;


select
    alertas_denuncia.id,
    alertas.id as id_alerta,
    alertas.motivo as motivo_alerta,
    denuncias.id as id_denuncia,
    denuncias.descricao as descricao_denuncia
from tbl_alertas_denuncia as alertas_denuncia
inner join tbl_alertas as alertas
    on alertas_denuncia.id_alerta = alertas.id
inner join tbl_denuncias as denuncias
    on alertas_denuncia.id_denuncia = denuncias.id;


select
    pagamento.id,
    pagamento.status as status_pagamento,
    pagamento.valor as valor_pagamento,
    pagamento.id_externo as id_externo_pagamento,
    anuncio.nome as nome_anuncio,
    usuario.nome as nome_comprador
from tbl_pagamento as pagamento
inner join tbl_anuncio as anuncio
    on pagamento.id_anuncio = anuncio.id
inner join tbl_usuario as usuario
    on pagamento.id_comprador = usuario.id;


select
    historico_pagamento.id,
    pagamento.id as id_pagamento,
    pagamento.id_externo as id_externo_pagamento,
    historico_pagamento.status as status_historico_pagamento,
    historico_pagamento.data_alteracao as data_alteracao_pagamento,
    historico_pagamento.detalhes as detalhes_historico_pagamento
from tbl_historico_pagamento as historico_pagamento
inner join tbl_pagamento as pagamento
    on historico_pagamento.id_pagamento = pagamento.id;


select
    ponto_coleta.id,
    ponto_coleta.nome as nome_ponto_coleta,
    ponto_coleta.descricao as descricao_ponto_coleta,
    ponto_coleta.status as status_ponto_coleta,
    ponto_coleta.latitude as latitude_ponto_coleta,
    ponto_coleta.longitude as longitude_ponto_coleta,
    categoria.nome as nome_categoria
from tbl_ponto_coleta as ponto_coleta
inner join tbl_categoria as categoria
    on ponto_coleta.id_categoria = categoria.id;


select
    endereco_usuario.id,
    usuario.nome as nome_usuario,
    endereco.cep as cep_endereco,
    endereco.rua as rua_endereco,
    endereco.numero as numero_endereco,
    endereco.complemento as complemento_endereco,
    endereco.bairro as bairro_endereco,
    endereco.cidade as cidade_endereco,
    endereco.estado as estado_endereco,
    endereco.sigla as sigla_endereco
from tbl_endereco_usuario as endereco_usuario
inner join tbl_endereco as endereco
    on endereco_usuario.id_endereco = endereco.id
inner join tbl_usuario as usuario
    on endereco_usuario.id_usuario = usuario.id;


select
    endereco_ponto_coleta.id,
    ponto_coleta.nome as nome_ponto_coleta,
    endereco.cep as cep_endereco,
    endereco.rua as rua_endereco,
    endereco.numero as numero_endereco,
    endereco.complemento as complemento_endereco,
    endereco.bairro as bairro_endereco,
    endereco.cidade as cidade_endereco,
    endereco.estado as estado_endereco,
    endereco.sigla as sigla_endereco
from tbl_endereco_ponto_coleta as endereco_ponto_coleta
inner join tbl_endereco as endereco
    on endereco_ponto_coleta.id_endereco = endereco.id
inner join tbl_ponto_coleta as ponto_coleta
    on endereco_ponto_coleta.id_ponto_coleta = ponto_coleta.id;


select
    ponto_coleta_material.id,
    ponto_coleta.nome as nome_ponto_coleta,
    material_aceito.nome as nome_material_aceito
from tbl_ponto_coleta_material_aceito as ponto_coleta_material
inner join tbl_ponto_coleta as ponto_coleta
    on ponto_coleta_material.id_ponto_coleta = ponto_coleta.id
inner join tbl_material_aceito as material_aceito
    on ponto_coleta_material.id_material_aceito = material_aceito.id;


select
    entrega.id,
    entrega.peso_estimado as peso_estimado_entrega,
    entrega.status as status_entrega,
    entrega.data_entrega as data_entrega,
    anuncio.nome as nome_anuncio,
    usuario.nome as nome_usuario
from tbl_entrega as entrega
inner join tbl_anuncio as anuncio
    on entrega.id_anuncio = anuncio.id
inner join tbl_usuario as usuario
    on entrega.id_usuario = usuario.id;


select
    imagem_entrega.id,
    imagem.url as url_imagem_entrega,
    entrega.id as id_entrega,
    entrega.status as status_entrega
from tbl_imagem_entrega as imagem_entrega
inner join tbl_imagem as imagem
    on imagem_entrega.id_imagem = imagem.id
inner join tbl_entrega as entrega
    on imagem_entrega.id_entrega = entrega.id;


select
    avaliacao.id,
    avaliacao.nota as nota_avaliacao,
    avaliacao.comentario as comentario_avaliacao,
    avaliacao.data_avaliacao as data_avaliacao,
    entrega.id as id_entrega,
    anuncio.nome as nome_anuncio,
    usuario.nome as nome_usuario
from tbl_avaliacao as avaliacao
inner join tbl_entrega as entrega
    on avaliacao.id_entrega = entrega.id
inner join tbl_anuncio as anuncio
    on entrega.id_anuncio = anuncio.id
inner join tbl_usuario as usuario
    on avaliacao.id_usuario = usuario.id;


select
    voucher.id,
    voucher.nome_parceiro as nome_parceiro_voucher,
    voucher.beneficio as beneficio_voucher,
    voucher.codigo as codigo_voucher,
    voucher.data_resgate as data_resgate_voucher,
    voucher.data_expiracao as data_expiracao_voucher,
    voucher.status as status_voucher,
    voucher.pontos_utilizados as pontos_utilizados_voucher,
    usuario.nome as nome_usuario
from tbl_voucher as voucher
inner join tbl_usuario as usuario
    on voucher.id_usuario = usuario.id;


select
    qr_code_entrega.id,
    qr_code.codigo as codigo_qr_code,
    qr_code.status as status_qr_code,
    anuncio.nome as nome_anuncio,
    entrega.id as id_entrega,
    entrega.status as status_entrega
from tbl_qr_code_entrega as qr_code_entrega
inner join tbl_qr_code as qr_code
    on qr_code_entrega.id_qr_code = qr_code.id
inner join tbl_anuncio as anuncio
    on qr_code_entrega.id_anuncio = anuncio.id
inner join tbl_entrega as entrega
    on qr_code_entrega.id_entrega = entrega.id;


select
    qr_code_voucher.id,
    qr_code.codigo as codigo_qr_code,
    qr_code.status as status_qr_code,
    voucher.codigo as codigo_voucher,
    voucher.nome_parceiro as nome_parceiro_voucher,
    voucher.status as status_voucher
from tbl_qr_code_voucher as qr_code_voucher
inner join tbl_qr_code as qr_code
    on qr_code_voucher.id_qr_code = qr_code.id
inner join tbl_voucher as voucher
    on qr_code_voucher.id_voucher = voucher.id;


select
    leitura_qr_code.id,
    leitura_qr_code.data_leitura as data_leitura_qr_code,
    leitura_qr_code.status as status_leitura_qr_code,
    qr_code.codigo as codigo_qr_code,
    usuario.nome as nome_usuario
from tbl_leitura_qr_code as leitura_qr_code
inner join tbl_qr_code as qr_code
    on leitura_qr_code.id_qr_code = qr_code.id
inner join tbl_usuario as usuario
    on leitura_qr_code.id_usuario = usuario.id;