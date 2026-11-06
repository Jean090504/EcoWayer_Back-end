create database if not exists ecowayer_db;
# DROP DATABASE ecowayer_db;
use ecowayer_db;

--------------------------------------------------------------------------------
#						tabelas sem chave estrangeira
--------------------------------------------------------------------------------

create table tbl_nivel_impacto (
	id         		int not null primary key auto_increment,
    nome			varchar(100) not null,
    numero			int not null,
    meta			decimal(10,2) not null,
    unidade			varchar(20) not null
);

create table tbl_insignia (
	id         		int not null primary key auto_increment,
    nome			varchar(100) not null,
    descricao		text not null,
    meta 			int not null,
    unidade			varchar(20) not null
);

create table tbl_genero (
	id         		int not null primary key auto_increment,
    nome			varchar(50) not null unique,
    sigla			varchar(5) not null unique
);

create table tbl_verificacao (
	id         		int not null primary key auto_increment,
    tentativas		int not null,
    tempo			int not null,
    reenvio			int not null,
    bloqueio		datetime null,
    ultimo_reenvio	datetime null
);

create table tbl_status_usuario (
	id         		int not null primary key auto_increment,
    status			enum('ativo', 'desativado') not null
);

create table tbl_material_aceito (
    id      		int not null primary key auto_increment,
    nome    		varchar(100) not null unique,
    icone   		varchar(255) not null
);

create table tbl_endereco (
	id   		int not null primary key auto_increment,
    cep			varchar(9) not null,
    rua			varchar(100) not null,
    numero		varchar(10) not null,
    complemento	varchar(50) null,
    bairro		varchar(100) not null,
    cidade		varchar(100) not null,
    estado		varchar(100) not null,
    sigla		varchar(3) not null,
    id_externo	varchar(255) not null
);

create table tbl_administrador (
    id                  int not null primary key auto_increment,
    nome                varchar(255) not null, -- alterado
    email               varchar(255) not null unique, -- alterado
    senha               varchar(255) not null
);

create table tbl_tipo_categoria (
    id                  int not null primary key auto_increment,
    nome                varchar(100) not null
);

create table tbl_tipo_modalidade (
    id                  int not null primary key auto_increment,
    tipo                varchar(50) not null
);

create table tbl_tipo_imagem (
    id                  int not null primary key auto_increment,
    tipo                varchar(50) not null
);

create table tbl_condicao_item(
    id 		int not null primary key auto_increment,
    nome 	varchar(50) not null unique
);

create table tbl_tipo_denuncias (
    id                  int not null primary key auto_increment,
    tipo                varchar(50) not null
);

create table tbl_ia (
    id                  int not null primary key auto_increment,
    nome                varchar(100) not null,
    provedor            varchar(50) not null,
    versao              varchar(20) not null,
    status              enum('ativo', 'inativo', 'treinando') not null,
    id_externo          varchar(255) not null -- alterado
);

create table tbl_dataset (
    id                  int not null primary key auto_increment,
    nome                varchar(100) not null,
    descricao           text not null
);

create table tbl_qr_code (
	id         			int not null primary key auto_increment,
    codigo				varchar(255) not null unique,
    data_criacao		datetime not null,
    data_expiracao		datetime not null,
    status				enum('ativo', 'utilizado', 'expirado', 'cancelado') not null
);

--------------------------------------------------------------------------------
#						tabelas com chave estrangeira
--------------------------------------------------------------------------------

create table tbl_categoria (
    id                  int not null primary key auto_increment,
    nome                varchar(100) not null unique,
    pontos              int not null,
    id_tipo_categoria   int not null,
    
    constraint FK_TIPOCATEGORIA_CATEGORIA
    foreign key (id_tipo_categoria)
    references tbl_tipo_categoria (id)
);

create table tbl_modalidade (
    id                  int not null primary key auto_increment,
    nome                varchar(45) not null unique,
    id_tipo_modalidade  int not null,
    
    constraint FK_TIPOMODALIDADE_MODALIDADE 
    foreign key (id_tipo_modalidade)
    references tbl_tipo_modalidade (id)
);

create table tbl_imagem (
    id                  int not null primary key auto_increment,
    url                 varchar(255) not null,
    id_tipo_imagem      int not null,
    
    constraint FK_TIPOIMAGEM_IMAGEM
    foreign key (id_tipo_imagem)
    references tbl_tipo_imagem (id)
);

create table tbl_usuario(
	id         			int not null primary key auto_increment,
    nome				varchar(255) not null,
    cpf					varchar(18) not null unique,
    data_nascimento 	date not null,
    id_imagem      		int not null,
    id_genero			int not null,
    id_status_usuario	int not null,
    id_nivel_impacto	int not null,
    
    constraint FK_IMAGEM_USUARIO	
	foreign key (id_imagem)
	references tbl_imagem(id),
    
    constraint FK_GENERO_USUARIO	
	foreign key (id_genero)
	references tbl_genero(id),
    
    constraint FK_STATUSUSUARIO_USUARIO	
	foreign key (id_status_usuario)
	references tbl_status_usuario(id),
    
    constraint FK_NIVELIMPACTO_USUARIO	
	foreign key (id_nivel_impacto)
	references tbl_nivel_impacto(id)
);

create table tbl_usuario_insignia (
	id         			int not null primary key auto_increment,
    progresso			decimal(5,2) not null,
    status				enum('em andamento','concluido') not null,
    id_usuario			int not null,
    id_insignia			int not null,
    
    constraint UK_USUARIOINSIGNIA
    unique (id_usuario, id_insignia), -- evita duplicar a mesma relação entre usuário e insignia.
    
    constraint FK_USUARIO_USUARIOINSIGNIA	
	foreign key (id_usuario)
	references tbl_usuario(id),
    
    constraint FK_INSIGNIA_USUARIOINSIGNIA	
	foreign key (id_insignia)
	references tbl_insignia(id)
);

create table tbl_voucher (
    id 					int not null primary key auto_increment,
    nome_parceiro 		varchar(150) not null,
    beneficio 			varchar(255) not null,
    codigo 				varchar(255) not null unique,
    data_resgate 		datetime not null,
    data_expiracao 		datetime not null,
    status 				enum('ativo', 'utilizado', 'expirado', 'cancelado') not null,
    pontos_utilizados 	int not null,
    id_usuario 			int not null,

    constraint FK_USUARIO_VOUCHER
    foreign key (id_usuario)
    references tbl_usuario(id)
);

create table tbl_email (
    id 					int not null primary key auto_increment,
    email 				varchar(255) not null unique,
    codigo_verificacao 	char(6) not null,
    id_usuario 			int not null unique, -- cada usuário pode ter apenas um email.

    constraint FK_USUARIO_EMAIL
    foreign key (id_usuario)
    references tbl_usuario(id)
);

create table tbl_telefone (
    id 					int not null primary key auto_increment,
    numero 				varchar(20) not null unique,
    codigo_verificacao 	char(6) not null,
    id_usuario 			int not null unique, -- cada usuário pode ter apenas um telefone.

    constraint FK_USUARIO_TELEFONE
    foreign key (id_usuario)
    references tbl_usuario(id)
);

-- Email e telefone: cada usuário possui apenas 
-- um email e um telefone. O unique em id_usuario 
-- impede que o mesmo usuário tenha mais de um 
-- registro de email ou telefone. O unique em email 
-- e numero impede que o mesmo contato seja utilizado 
-- simultaneamente por usuários diferentes. Caso o 
-- usuário altere seu email ou telefone futuramente, 
-- o contato anterior será liberado para um novo cadastro.
-- (funcionalidade futura)

create table tbl_email_verificacao (
	id         			int not null primary key auto_increment,
    id_email       		int not null,
    id_verificacao      int not null,
    
    constraint FK_EMAIL_EMAILVERIFICACAO
	foreign key (id_email)
	references tbl_email(id),

	constraint FK_VERIFICACAO_EMAILVERIFICACAO
	foreign key (id_verificacao)
	references tbl_verificacao(id)
);

create table tbl_telefone_verificacao (
	id         			int not null primary key auto_increment,
    id_telefone       	int not null,
    id_verificacao      int not null,
    
    constraint FK_TELEFONE_TELEFONEVERIFICACAO
	foreign key (id_telefone)
	references tbl_telefone(id),

	constraint FK_VERIFICACAO_TELEFONEVERIFICACAO
	foreign key (id_verificacao)
	references tbl_verificacao(id)
);

create table tbl_conta (
	id         			int not null primary key auto_increment,
    senha				varchar(255) not null,
    id_email			int not null unique,
    
    constraint FK_EMAIL_CONTA
	foreign key (id_email)
	references tbl_email(id)
);

create table tbl_treinamento_ia (
    id                  int not null primary key auto_increment,
    status              enum('pendente', 'em andamento', 'concluido', 'erro') not null,
    id_externo          varchar(255) not null, -- alterado
    id_ia               int not null,
    id_dataset          int not null,
    
    constraint FK_IA_TREINAMENTOIA
    foreign key (id_ia)
    references tbl_ia (id),
    
    constraint FK_DATASET_TREINAMENTOIA
    foreign key (id_dataset)
    references tbl_dataset (id)
);

create table tbl_anuncio (
    id                  int not null primary key auto_increment,
    nome                varchar(100) not null,
    descricao           text null,
    data_publicacao     datetime not null,
    id_usuario          int not null,
    id_categoria        int not null,
    id_modalidade       int not null,
    id_condicao_item 	int not null,
    
    constraint FK_USUARIO_ANUNCIO
    foreign key (id_usuario)
    references tbl_usuario (id),
    
    constraint FK_CATEGORIA_ANUNCIO
    foreign key (id_categoria)
    references tbl_categoria (id),
    
    constraint FK_MODALIDADE_ANUNCIO
    foreign key (id_modalidade)
    references tbl_modalidade (id),
    
    constraint FK_CONDICAOITEM_ANUNCIO
	foreign key (id_condicao_item)
	references tbl_condicao_item(id)
);

create table tbl_imagem_anuncio (
    id                  int not null primary key auto_increment,
    id_imagem           int not null,
    id_anuncio          int not null,
    
    unique (id_imagem, id_anuncio), -- evita duplicar a mesma relação entre imagem e anúncio.
    
    constraint FK_IMAGEM_IMAGEMANUNCIO
    foreign key (id_imagem)
    references tbl_imagem (id),
    
    constraint FK_ANUNCIO_IMAGEMANUNCIO
    foreign key (id_anuncio)
    references tbl_anuncio (id)
);

create table tbl_pontos (
	id         			int not null primary key auto_increment,
    qntd_pontos			int not null,
    data_registro		datetime not null,
	id_categoria		int not null,
    id_usuario			int not null,
    
    constraint FK_CATEGORIA_PONTOS
	foreign key (id_categoria)
	references tbl_categoria(id),
    
    constraint FK_USUARIO_PONTOS
	foreign key (id_usuario)
	references tbl_usuario(id)
);

create table tbl_historico_anuncio ( 
	id         			int not null primary key auto_increment,
    status				enum('ativo', 'desativado', 'apagado', 'negociado') not null,
    data_alteracao		datetime not null,
    detalhes			text null,
	id_anuncio			int not null,
    
	constraint FK_ANUNCIO_HISTORICOANUNCIO
	foreign key (id_anuncio)
	references tbl_anuncio(id)
);

create table tbl_conversa (
    id                  int not null primary key auto_increment,
    id_anuncio          int not null,
    id_usuario          int not null,
    
    constraint FK_ANUNCIO_CONVERSA
    foreign key (id_anuncio)
    references tbl_anuncio (id),
    
    constraint FK_USUARIO_CONVERSA
    foreign key (id_usuario)
    references tbl_usuario (id)
);

create table tbl_mensagens (
    id                  int not null primary key auto_increment,
    texto               text not null,
    envio               datetime not null,
    lida                tinyint not null default 0,
    id_conversa         int not null,
    id_remetente        int not null,
    
    constraint FK_CONVERSA_MENSAGENS
    foreign key (id_conversa)
    references tbl_conversa (id),
    
    constraint FK_USUARIO_MENSAGENS
    foreign key (id_remetente)
    references tbl_usuario (id)
);

create table tbl_denuncias (
    id                  int not null primary key auto_increment,
    descricao           text not null,
    id_tipo_denuncias   int not null,
    id_denunciante      int not null,
    
    constraint FK_TIPODENUNCIAS_DENUNCIAS
    foreign key (id_tipo_denuncias)
    references tbl_tipo_denuncias (id),
    
    constraint FK_USUARIO_DENUNCIAS
    foreign key (id_denunciante)
    references tbl_usuario (id)
);

create table tbl_denuncias_mensagens (
    id                  int not null primary key auto_increment,
    id_denuncias        int not null,
    id_mensagens        int not null,
    
    constraint UK_DENUNCIAMENSAGEM
    unique (id_denuncias, id_mensagens), 
    
    constraint FK_DENUNCIAS_DENUNCIASMENSAGENS
    foreign key (id_denuncias)
    references tbl_denuncias (id),
    
    constraint FK_MENSAGENS_DENUNCIASMENSAGENS
    foreign key (id_mensagens)
    references tbl_mensagens (id)
);

create table tbl_imagem_denuncias (
    id                  int not null primary key auto_increment,
    id_imagem           int not null,
    id_denuncias        int not null,
    
    constraint UK_IMG_DENUNCIA 
    unique (id_imagem, id_denuncias), -- evita duplicar a mesma relação entre imagem e denuncias
    
    constraint FK_IMAGEM_IMAGEMDENUNCIAS
    foreign key (id_imagem)
    references tbl_imagem (id),
    
    constraint FK_DENUNCIAS_IMAGEMDENUNCIAS
    foreign key (id_denuncias)
    references tbl_denuncias (id)
);

create table tbl_denuncias_anuncio(
    id                  int not null primary key auto_increment,
    id_denuncias        int not null,
    id_anuncio        	int not null,
    
    constraint UK_DENUNCIAANUNCIO
    unique (id_denuncias, id_anuncio), -- evita duplicar a mesma relação entre denúncia e anuncio.
    
    constraint FK_DENUNCIAS_DENUNCIASANUNCIO
    foreign key (id_denuncias)
    references tbl_denuncias (id),
    
    constraint FK_ANUNCIO_DENUNCIASANUNCIO
    foreign key (id_anuncio)
    references tbl_anuncio (id)
);

create table tbl_alertas (
    id                  int not null primary key auto_increment,
    motivo              text not null,
    status              enum('pendente', 'revisado', 'resolvido') not null,
    acao                varchar(100) not null,
    id_ia               int not null,
    id_usuario          int not null, -- usuário identificado pela IA como suspeito.

    constraint FK_IA_ALERTAS
    foreign key (id_ia)
    references tbl_ia (id),

    constraint FK_USUARIO_ALERTAS
    foreign key (id_usuario)
    references tbl_usuario (id)
);

create table tbl_alertas_anuncio (
    id                  int not null primary key auto_increment,
    id_alerta           int not null,
    id_anuncio          int not null,

    constraint UK_ALERTAANUNCIO
    unique (id_alerta, id_anuncio), -- evita duplicar a mesma relação entre alerta e anúncio.

    constraint FK_ALERTA_ALERTASANUNCIO
    foreign key (id_alerta)
    references tbl_alertas (id),

    constraint FK_ANUNCIO_ALERTASANUNCIO
    foreign key (id_anuncio)
    references tbl_anuncio (id)
);

create table tbl_alertas_mensagem (
    id                  int not null primary key auto_increment,
    id_alerta           int not null,
    id_mensagem         int not null,

    constraint UK_ALERTAMENSAGEM
    unique (id_alerta, id_mensagem), -- evita duplicar a mesma relação entre alerta e mensagem.

    constraint FK_ALERTA_ALERTASMENSAGEM
    foreign key (id_alerta)
    references tbl_alertas (id),

    constraint FK_MENSAGEM_ALERTASMENSAGEM
    foreign key (id_mensagem)
    references tbl_mensagens (id)
);

create table tbl_alertas_denuncias (
    id                   int not null primary key auto_increment,
    id_alertas           int not null,
    id_denuncias         int not null,

    constraint UK_ALERTAS_DENUNCIAS
    unique (id_alertas, id_denuncias), -- evita duplicar a mesma relação entre alerta e denúncia.

    constraint FK_ALERTAS_DENUNCIA_ALERTA
    foreign key (id_alertas)
    references tbl_alertas (id),

    constraint FK_ALERTAS_DENUNCIAS_DENUNCIA
    foreign key (id_denuncias)
    references tbl_denuncias (id)
);

create table tbl_pagamento (
	id         			int not null primary key auto_increment,
    status				enum('pendente', 'aprovado', 'recusado', 'estornado', 'cancelado') not null,
    valor				decimal(10,2) not null,
    id_externo			varchar(255) not null,
    id_anuncio			int not null,
    id_comprador		int not null,
    
    constraint FK_ANUNCIO_PAGAMENTO
	foreign key (id_anuncio)
	references tbl_anuncio(id),
    
    constraint FK_USUARIO_PAGAMENTO
	foreign key (id_comprador)
	references tbl_usuario(id)
);

create table tbl_historico_pagamento (
	id         			int not null primary key auto_increment,
    status				enum('pendente', 'aprovado', 'recusado', 'estornado', 'cancelado') not null,
    data_alteracao		datetime not null,
    detalhes			text not null,
    id_pagamento		int not null,
    
    constraint FK_PAGAMENTO_HISTORICOPAGAMENTO
	foreign key (id_pagamento)
	references tbl_pagamento(id)
);

create table tbl_ponto_coleta (
	id   			int not null primary key auto_increment,
    nome			varchar(100) not null,
    descricao		text not null,
    status			enum('ativo','inativo') not null,
    latitude 		decimal(9,6) null,
	longitude 		decimal(9,6) null,
    id_categoria	int not null,
    
    constraint FK_CATEGORIA_PONTOCOLETA
	foreign key (id_categoria)
	references tbl_categoria(id)
);

create table tbl_endereco_usuario (
	id   		int not null primary key auto_increment,
    id_endereco	int not null,
    id_usuario	int not null,
    
    constraint FK_ENDERECO_ENDERECOUSUARIO
	foreign key (id_endereco)
	references tbl_endereco(id),
    
    constraint FK_USUARIO_ENDERECOUSUARIO
	foreign key (id_usuario)
	references tbl_usuario(id)
);

create table tbl_endereco_ponto_coleta (
	id   			int not null primary key auto_increment,
    id_endereco		int not null,
    id_ponto_coleta	int not null,
    
    constraint FK_ENDERECO_ENDERECOPONTOCOLETA
	foreign key (id_endereco)
	references tbl_endereco(id),
    
    constraint FK_PONTOCOLETA_ENDERECOPONTOCOLETA
	foreign key (id_ponto_coleta)
	references tbl_ponto_coleta(id)
);

create table tbl_ponto_coleta_material_aceito (
	id         			int not null primary key auto_increment,
    id_ponto_coleta		int not null,
    id_material_aceito	int not null,
    
    constraint UK_PONTOCOLETAMATERIALACEITO
    unique (id_ponto_coleta, id_material_aceito), -- evita duplicar a mesma relação entre ponto de coleta e material.
    
    constraint FK_PONTOCOLETA_PONTOCOLETAMATERIALACEITO
	foreign key (id_ponto_coleta)
	references tbl_ponto_coleta(id),
    
    constraint FK_MATERIALACEITO_PONTOCOLETAMATERIALACEITO
	foreign key (id_material_aceito)
	references tbl_material_aceito(id)
);

create table tbl_entrega (
	id         			int not null primary key auto_increment,
    peso_estimado		decimal(10,2) not null,
    status				enum('pendente', 'concluida', 'cancelada') not null,
    data_entrega		datetime not null,
	id_anuncio			int not null,
	id_usuario			int not null,
    
	constraint FK_ANUNCIO_ENTREGA
	foreign key (id_anuncio)
	references tbl_anuncio(id),

	constraint FK_USUARIO_ENTREGA
	foreign key (id_usuario)
	references tbl_usuario(id)
);

create table tbl_imagem_entrega (
	id         			int not null primary key auto_increment,
	id_imagem			int not null,
    id_entrega			int not null,
    
    constraint UK_IMAGEMENTREGA
    unique (id_imagem, id_entrega), -- evita repetir a mesma imagem na mesma entrega.
    
	constraint FK_IMAGEM_IMAGEMENTREGA
	foreign key (id_imagem)
	references tbl_imagem(id),
    
    constraint FK_ENTREGA_IMAGEMENTREGA
	foreign key (id_entrega)
	references tbl_entrega(id)
);

create table tbl_avaliacao (
    id 				int not null primary key auto_increment,
    nota 			int not null,
    comentario 		text null,
    data_avaliacao 	datetime not null,
    id_entrega 		int not null,
    id_usuario 		int not null,

    constraint FK_ENTREGA_AVALIACAO
    foreign key (id_entrega)
    references tbl_entrega(id),

    constraint FK_USUARIO_AVALIACAO
    foreign key (id_usuario)
    references tbl_usuario(id)
);

create table tbl_qr_code_entrega (
    id 			int not null primary key auto_increment,
    id_qr_code 	int not null,
    id_anuncio 	int not null,
    id_entrega 	int not null,

    constraint UK_QRCODEENTREGA
    unique (id_qr_code, id_anuncio, id_entrega), -- impede repetir o mesmo vínculo

    constraint FK_QRCODE_QRCODEENTREGA
    foreign key (id_qr_code)
    references tbl_qr_code(id),

    constraint FK_ANUNCIO_QRCODEENTREGA
    foreign key (id_anuncio)
    references tbl_anuncio(id),

    constraint FK_ENTREGA_QRCODEENTREGA
    foreign key (id_entrega)
    references tbl_entrega(id)
);

create table tbl_qr_code_voucher (
    id 			int not null primary key auto_increment,
    id_qr_code 	int not null,
    id_voucher 	int not null,

    constraint UK_QRCODEVOUCHER -- impede repetir o mesmo vínculo
    unique (id_qr_code, id_voucher),

    constraint FK_QRCODE_QRCODEVOUCHER
    foreign key (id_qr_code)
    references tbl_qr_code(id),

    constraint FK_VOUCHER_QRCODEVOUCHER
    foreign key (id_voucher)
    references tbl_voucher(id)
);

create table tbl_leitura_qr_code (
	id         			int not null primary key auto_increment,
    data_leitura		datetime not null,
    status				enum('valida', 'invalida', 'expirada') not null,
    id_qr_code			int not null,
    id_usuario			int not null,
    
    constraint FK_QRCODE_LEITURAQRCODE
	foreign key (id_qr_code)
	references tbl_qr_code(id),
    
    constraint FK_USUARIO_LEITURAQRCODE
	foreign key (id_usuario)
	references tbl_usuario(id)
);