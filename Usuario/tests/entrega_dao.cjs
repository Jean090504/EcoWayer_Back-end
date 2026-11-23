const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

test('DAO exporta operações de entrega e retorna os registros da consulta', async () => {
    const rows = [{ id: 1, id_usuario: 2 }];
    const queries = [];
    const sandbox = { module: { exports: {} }, console, require: name => {
        if (name === 'knex') return () => ({ raw: async (sql, bindings) => {
            queries.push({ sql, bindings });
            return [rows];
        }});
        if (name.endsWith('knexFile.js')) return { development: {} };
        throw new Error('Dependência inesperada: ' + name);
    }};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../model/DAO/entrega/entrega.js'), 'utf8'), sandbox);
    const dao = sandbox.module.exports;
    for (const name of ['insertEntrega', 'updateEntrega', 'selectAllEntregas', 'selectEntregaById', 'deleteEntrega']) {
        assert.equal(typeof dao[name], 'function', name);
    }
    assert.equal(await dao.selectAllEntregas(), rows);
    assert.match(queries[0].sql, /select \* from tbl_entrega order by id/i);
    assert.equal(await dao.selectEntregaById(1), rows);
    assert.equal(queries[1].bindings[0], 1);
});
