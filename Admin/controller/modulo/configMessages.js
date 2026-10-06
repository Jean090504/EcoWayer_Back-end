/***************************************************************
 *  Objetivo: Arquivo responsavel pela configutação de mensagnes
 *  Autor: Maxwillian Santana
 *  Data:  17/04/2026
 *  Versão : 1.0
 ***************************************************************/

//Padronizção de cabeçario para retorno dos endpoints da api
const DEFAULT_MESSAGE = {

    api_description: 'API para gerenciar o controle de Filmes',
    development: 'Maxwillian Santana',
    version: '1.0.4.26',
    status: Boolean,
    status_code: Number,
    response : {}
}

//mensagens de erro da API
const ERROR_BAD_REQUEST              = {status:false, status_code:400,message:'Os Dados enviados na requisição não estão corretos!'}
const ERROR_INTERNAL_SEVER_MODEL     = {status:false, status_code:500,message:'NÃO FOI POSSIVEL PROCESSAR A REQUISIÇÃO POR CONTA DE ERRO NA API [ERRO NA MODELAGEM DE DADOS]!'}
const ERROR_CONTENT_TYPE             = {status:false, status_code:415,message:'NÃO FOI POSSIVEL PROCESSAR A REQUISIÇÃO, pois o formato de dados aceito pela API é somente JSON!'}
const ERROR_INTERNAL_CONTROLER       = {status:false, status_code:500,message:'NÃO FOI POSSIVEL PROCESSAR A REQUISIÇÃO POR CONTA DE ERRO NA API [ERRO NA CONTROLER]!'}
const ERROR_NOT_FOUND                = {status:false, status_code:404,message:'NÃO FOI ENCONTRADO NENHUM DADO PARA RETORNO!'}

//mensagens de sucesso da API 
const SUCCESS_CREATED_ITEM      = {status : true, status_code:201,message:'Registro inserido com um sucesso!'} // Retorno para GET
const SUCCESS_UPDETED_ITEM      = {status : true, status_code:201,message:'Registro atualizado com um sucesso!'} // Retorno para PUT
const SUCCESS_RESPONSE          = {status : true, status_code:200} // Retorno para GET
const SUCCESS_DELETED_ITEM      =  {status : true, status_code:200,message:'Registro Deletado com um sucesso!'} // Retorno para GET
const SUCCESS_CREATED_WARNING      = {status : true, status_code:201,message:'Os dados principais foram inseridos com um sucesso, porem alguns dados apresentaram problemas'} // Retorno para GET




module.exports = {

    DEFAULT_MESSAGE,
    ERROR_BAD_REQUEST,  SUCCESS_CREATED_ITEM,
    ERROR_INTERNAL_SEVER_MODEL, ERROR_CONTENT_TYPE,
    ERROR_INTERNAL_CONTROLER, ERROR_NOT_FOUND,
    SUCCESS_RESPONSE, SUCCESS_UPDETED_ITEM,
    SUCCESS_DELETED_ITEM, SUCCESS_CREATED_WARNING
}