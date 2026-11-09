/* Perguntas reaproveitadas do ZapChat original. Dados e fluxo compartilhados pelas telas. */
(function(root){
  'use strict';
  const questions={
  "operacao": {
    "titulo": "Como funciona o seu negócio?",
    "descricao": "Queremos entender onde e como sua operação acontece.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "fixo",
        "titulo": "Tenho um local fixo",
        "descricao": "Minha empresa funciona principalmente em um endereço físico.",
        "icone": "⌂"
      },
      {
        "id": "movel",
        "titulo": "Meu negócio é móvel",
        "descricao": "Vendo ou presto serviços em diferentes locais.",
        "icone": "↗"
      },
      {
        "id": "hibrido",
        "titulo": "Tenho um local fixo e também vendo em outros lugares",
        "descricao": "Tenho uma operação fixa, mas também vendo fora dela.",
        "icone": "⌂↗"
      },
      {
        "id": "online",
        "titulo": "Meu negócio é principalmente online",
        "descricao": "Minhas vendas acontecem principalmente pela internet.",
        "icone": "⌁"
      }
    ]
  },
  "segmento": {
    "titulo": "Que tipo de negócio você tem?",
    "descricao": "Isso ajuda o StockZap a entender quais ferramentas fazem sentido para você.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "alimentacao",
        "titulo": "Alimentação",
        "descricao": "Restaurante, lanchonete, confeitaria, food truck etc.",
        "icone": "🍴"
      },
      {
        "id": "mercado",
        "titulo": "Mercado ou conveniência",
        "descricao": "Mercados, mercearias e lojas de conveniência.",
        "icone": "🛒"
      },
      {
        "id": "vestuario",
        "titulo": "Vestuário",
        "descricao": "Roupas, calçados e acessórios.",
        "icone": "◈"
      },
      {
        "id": "beleza",
        "titulo": "Beleza",
        "descricao": "Salão, barbearia, estética ou estúdio.",
        "icone": "✦"
      },
      {
        "id": "artesanato",
        "titulo": "Artesanato",
        "descricao": "Produtos artesanais e produção própria.",
        "icone": "✋"
      },
      {
        "id": "eletronicos",
        "titulo": "Eletrônicos",
        "descricao": "Venda de eletrônicos e acessórios.",
        "icone": "▣"
      },
      {
        "id": "casa",
        "titulo": "Casa e decoração",
        "descricao": "Produtos para casa, decoração e utilidades.",
        "icone": "⌂"
      },
      {
        "id": "eventos",
        "titulo": "Eventos e feiras",
        "descricao": "Vendas em eventos, feiras e ocasiões especiais.",
        "icone": "★"
      },
      {
        "id": "servicos",
        "titulo": "Serviços",
        "descricao": "Prestação de serviços para clientes.",
        "icone": "⚙"
      },
      {
        "id": "outro",
        "titulo": "Outro",
        "descricao": "Meu negócio não se encaixa nessas opções.",
        "icone": "..."
      }
    ]
  },
  "oferta": {
    "titulo": "O que você vende?",
    "descricao": "Conte como seu produto ou serviço chega até o cliente.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "prontos",
        "titulo": "Produtos prontos",
        "descricao": "Compro ou recebo produtos e revendo.",
        "icone": "□"
      },
      {
        "id": "producao",
        "titulo": "Produção própria",
        "descricao": "Eu mesmo produzo o que vendo.",
        "icone": "⚒"
      },
      {
        "id": "produtos_servicos",
        "titulo": "Produtos + serviços",
        "descricao": "Meu negócio vende produtos e também presta serviços.",
        "icone": "◈"
      },
      {
        "id": "servicos",
        "titulo": "Só serviços",
        "descricao": "Meu negócio trabalha principalmente com serviços.",
        "icone": "⚙"
      },
      {
        "id": "pre_venda",
        "titulo": "Pré-venda / encomenda",
        "descricao": "Produzo ou compro principalmente depois do pedido.",
        "icone": "◷"
      }
    ]
  },
  "quantidade": {
    "titulo": "Quantos itens diferentes você trabalha?",
    "descricao": "Pode ser uma estimativa. Queremos entender o tamanho do seu catálogo.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "ate20",
        "titulo": "Até 20",
        "descricao": "Catálogo pequeno e mais enxuto.",
        "icone": "20"
      },
      {
        "id": "21_50",
        "titulo": "21 a 50",
        "descricao": "Tenho uma variedade moderada de produtos.",
        "icone": "50"
      },
      {
        "id": "51_100",
        "titulo": "51 a 100",
        "descricao": "Tenho um catálogo relativamente grande.",
        "icone": "100"
      },
      {
        "id": "mais100",
        "titulo": "Mais de 100",
        "descricao": "Tenho muitos produtos ou variações.",
        "icone": "+100"
      }
    ]
  },
  "estoque": {
    "titulo": "Como você trabalha com estoque?",
    "descricao": "Isso nos ajuda a entender o quanto o controle de estoque é importante para sua operação.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "estoque",
        "titulo": "Mantenho estoque dos produtos",
        "descricao": "Tenho produtos disponíveis antes da venda.",
        "icone": "▣"
      },
      {
        "id": "encomenda",
        "titulo": "Trabalho principalmente por encomenda",
        "descricao": "Produzo ou compro depois que recebo o pedido.",
        "icone": "◷"
      },
      {
        "id": "ambos",
        "titulo": "Faço os dois",
        "descricao": "Tenho estoque, mas também trabalho com encomendas.",
        "icone": "◈"
      }
    ]
  },
  "insumos": {
    "titulo": "Você controla matéria-prima ou insumos?",
    "descricao": "Essa informação é importante para negócios que produzem seus próprios produtos.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "sim",
        "titulo": "Sim",
        "descricao": "Quero controlar os ingredientes ou materiais utilizados.",
        "icone": "✓"
      },
      {
        "id": "nao",
        "titulo": "Não",
        "descricao": "Não preciso controlar matéria-prima.",
        "icone": "—"
      }
    ]
  },
  "receita": {
    "titulo": "Você usa receitas ou fichas técnicas?",
    "descricao": "Por exemplo: uma receita de bolo, uma montagem ou uma ficha de produção.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "sim",
        "titulo": "Sim",
        "descricao": "Tenho receitas ou fichas que sigo.",
        "icone": "✓"
      },
      {
        "id": "nao",
        "titulo": "Não",
        "descricao": "Não trabalho dessa forma.",
        "icone": "—"
      }
    ]
  },
  "canais": {
    "titulo": "Onde acontecem suas vendas?",
    "descricao": "Selecione todos os canais que fazem parte da sua operação.",
    "tipo": "multi",
    "opcoes": [
      {
        "id": "local",
        "titulo": "Estabelecimento",
        "descricao": "Vendo em uma loja, salão ou espaço físico.",
        "icone": "⌂"
      },
      {
        "id": "whatsapp",
        "titulo": "WhatsApp",
        "descricao": "Recebo pedidos ou converso com clientes pelo WhatsApp.",
        "icone": "◉"
      },
      {
        "id": "instagram",
        "titulo": "Instagram",
        "descricao": "Recebo clientes ou pedidos pelo Instagram.",
        "icone": "◎"
      },
      {
        "id": "site",
        "titulo": "Site",
        "descricao": "Tenho vendas ou pedidos pelo meu site.",
        "icone": "⌁"
      },
      {
        "id": "feiras",
        "titulo": "Feiras e eventos",
        "descricao": "Vendo presencialmente em eventos.",
        "icone": "★"
      },
      {
        "id": "direta",
        "titulo": "Venda direta",
        "descricao": "Vendo diretamente para pessoas.",
        "icone": "●"
      }
    ]
  },
  "controle": {
    "titulo": "Como você controla seu negócio hoje?",
    "descricao": "Não tem problema se ainda não usa nenhum sistema.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "papel",
        "titulo": "Papel e caderno",
        "descricao": "Anoto as informações manualmente.",
        "icone": "▤"
      },
      {
        "id": "planilha",
        "titulo": "Planilhas",
        "descricao": "Uso Excel, Google Sheets ou algo parecido.",
        "icone": "▦"
      },
      {
        "id": "sistema",
        "titulo": "Outro sistema",
        "descricao": "Já utilizo algum software de gestão.",
        "icone": "▣"
      },
      {
        "id": "cabeca",
        "titulo": "Na cabeça",
        "descricao": "Ainda controlo muita coisa de memória.",
        "icone": "●"
      },
      {
        "id": "nada",
        "titulo": "Não controlo",
        "descricao": "Ainda não tenho um método definido.",
        "icone": "—"
      }
    ]
  },
  "financeiro": {
    "titulo": "Como você controla suas finanças?",
    "descricao": "Queremos entender o nível de organização financeira atual.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "papel",
        "titulo": "Papel",
        "descricao": "Anoto entradas e saídas manualmente.",
        "icone": "▤"
      },
      {
        "id": "planilha",
        "titulo": "Planilha",
        "descricao": "Uso uma planilha.",
        "icone": "▦"
      },
      {
        "id": "sistema",
        "titulo": "Sistema",
        "descricao": "Uso algum sistema financeiro.",
        "icone": "▣"
      },
      {
        "id": "cabeca",
        "titulo": "Na cabeça",
        "descricao": "Faço o controle mentalmente.",
        "icone": "●"
      },
      {
        "id": "nada",
        "titulo": "Não controlo",
        "descricao": "Ainda não faço controle financeiro.",
        "icone": "—"
      }
    ]
  },
  "equipe": {
    "titulo": "Quantas pessoas trabalham no negócio?",
    "descricao": "Pode contar você mesmo na equipe.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "so_eu",
        "titulo": "Só eu",
        "descricao": "Eu faço praticamente tudo.",
        "icone": "1"
      },
      {
        "id": "2_3",
        "titulo": "2 a 3 pessoas",
        "descricao": "Tenho uma equipe pequena.",
        "icone": "3"
      },
      {
        "id": "4_10",
        "titulo": "4 a 10 pessoas",
        "descricao": "Tenho uma equipe maior.",
        "icone": "10"
      },
      {
        "id": "mais10",
        "titulo": "Mais de 10",
        "descricao": "Tenho uma operação com várias pessoas.",
        "icone": "+10"
      }
    ]
  },
  "whatsapp": {
    "titulo": "Qual é o papel do WhatsApp no seu negócio?",
    "descricao": "Essa resposta ajuda o StockZap a entender como você se comunica com seus clientes.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "principal",
        "titulo": "É meu principal canal de vendas",
        "descricao": "Grande parte dos pedidos chega pelo WhatsApp.",
        "icone": "◉"
      },
      {
        "id": "clientes",
        "titulo": "Uso para falar com clientes",
        "descricao": "Uso bastante, mas não é meu principal canal.",
        "icone": "◌"
      },
      {
        "id": "pouco",
        "titulo": "Uso pouco",
        "descricao": "Utilizo apenas ocasionalmente.",
        "icone": "○"
      },
      {
        "id": "nao",
        "titulo": "Não uso",
        "descricao": "Não utilizo WhatsApp no negócio.",
        "icone": "—"
      }
    ]
  },
  "prioridade": {
    "titulo": "O que mais precisa melhorar hoje?",
    "descricao": "Escolha o principal problema que você gostaria de resolver.",
    "tipo": "single",
    "opcoes": [
      {
        "id": "estoque",
        "titulo": "Estoque",
        "descricao": "Quero saber o que tenho, o que está acabando e o que está parado.",
        "icone": "▣"
      },
      {
        "id": "produtos",
        "titulo": "Produtos",
        "descricao": "Quero organizar melhor meu catálogo.",
        "icone": "□"
      },
      {
        "id": "vendas",
        "titulo": "Vendas",
        "descricao": "Quero vender mais e entender minhas vendas.",
        "icone": "↗"
      },
      {
        "id": "financeiro",
        "titulo": "Financeiro",
        "descricao": "Quero entender melhor dinheiro, custos e lucro.",
        "icone": "R$"
      },
      {
        "id": "pedidos",
        "titulo": "Pedidos",
        "descricao": "Quero organizar pedidos e não perder encomendas.",
        "icone": "✓"
      },
      {
        "id": "equipe",
        "titulo": "Equipe",
        "descricao": "Quero organizar pessoas, acessos e responsabilidades.",
        "icone": "●"
      },
      {
        "id": "tudo",
        "titulo": "Um pouco de tudo",
        "descricao": "Quero organizar o negócio como um todo.",
        "icone": "✦"
      }
    ]
  }
};
  const base=['operacao','segmento','oferta','quantidade','estoque','canais','controle','financeiro','equipe','whatsapp','prioridade'];
  function flow(answers={}){answers=answers&&typeof answers==='object'?answers:{};return base.flatMap(key=>key==='oferta'&&answers.oferta==='producao'?[key,'insumos','receita']:[key]);}
  function clean(input={}){
    input=input&&typeof input==='object'?input:{};
    const result={};
    for(const key of flow(input)){
      const q=questions[key],value=input[key],allowed=q.opcoes.map(o=>o.id);
      if(q.tipo==='multi'){
        if(Array.isArray(value)){const selected=[...new Set(value.filter(v=>allowed.includes(v)))];if(selected.length)result[key]=selected;}
      }else if(typeof value==='string'&&allowed.includes(value))result[key]=value;
    }
    return result;
  }
  function complete(data){return data?.version===1&&data.completed===true&&flow(data.answers).every(key=>Boolean(clean(data.answers)[key]));}
  function rows(input){const answers=clean(input);return flow(answers).map(key=>({key,title:questions[key].titulo,answer:[answers[key]].flat().map(value=>questions[key].opcoes.find(o=>o.id===value)?.titulo).filter(Boolean).join(' · ')||'Não respondido'}));}
  const api={questions,flow,clean,complete,rows};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.SZOnboarding=api;
})(typeof window!=='undefined'?window:globalThis);
