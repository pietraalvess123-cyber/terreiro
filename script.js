/**
 * Gestão do Terreiro - Ilê Asé Tonin Ewe Oya
 * Toda a lógica do app: dados (localStorage), login e permissões, telas e formulários.
 * Carregado pelo index.html. Não depende de bibliotecas externas (JavaScript puro).
 */
/* ---------- Ícones (Lucide) ---------- */
/** Tabela que relaciona cada emoji usado nos textos ao ícone Lucide equivalente (definido em icons.js). */
const EMOJI_ICON={'🏠':'house','📅':'calendar-days','👥':'users','💰':'coins','🎁':'gift','📊':'chart-column','📖':'book-open','🖼':'image','🧺':'shopping-basket','🥥':'nut','🌿':'leaf','📋':'clipboard-list','✅':'circle-check','🔑':'key-round','👤':'user','⏻':'power','⋮':'ellipsis-vertical','✔':'check','🎉':'party-popper','🎂':'cake','🔮':'sparkles','🧾':'receipt','📷':'camera','📁':'folder','🖨':'printer','⬆':'upload','⬇':'download','✎':'pencil','◀':'chevron-left','▶':'chevron-right'};
const EMOJI_SRC='('+Object.keys(EMOJI_ICON).join('|')+')\\uFE0F?',EMOJI_RE=new RegExp(EMOJI_SRC,'g'),EMOJI_TEST=new RegExp(EMOJI_SRC),ICO_SKIP=/^(SCRIPT|STYLE|TEXTAREA|OPTION|TITLE)$/;
/** Preenche um espaço de ícone com o SVG correspondente, se o arquivo icons.js já tiver chegado; remove o esqueleto. */
function icoFill(el){const p=window.ICONS&&ICONS[el.dataset.n];if(!p||el.dataset.f)return;el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';el.classList.remove('skel');el.dataset.f=1}
/** Chamada quando o icons.js termina de carregar: troca todos os esqueletos pendentes pelos ícones. */
function iconsReady(){document.querySelectorAll('.ico[data-n]').forEach(icoFill)}
/** Troca os emojis de um texto por ícones (com esqueleto até o SVG estar disponível). */
function swapText(t){const s=t.nodeValue,f=document.createDocumentFragment();let last=0,m;EMOJI_RE.lastIndex=0;
  while((m=EMOJI_RE.exec(s))){if(m.index>last)f.append(s.slice(last,m.index));const sp=document.createElement('span');sp.className='ico skel';sp.dataset.n=EMOJI_ICON[m[1]];sp.setAttribute('aria-hidden','true');icoFill(sp);f.append(sp);last=m.index+m[0].length}
  if(last<s.length)f.append(s.slice(last));t.replaceWith(f)}
/** Percorre um trecho da página e troca todos os emojis encontrados por ícones. */
function iconize(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),a=[];let n;while((n=w.nextNode()))if(!ICO_SKIP.test(n.parentNode.nodeName)&&EMOJI_TEST.test(n.nodeValue))a.push(n);a.forEach(swapText)}
/** Observa a página: todo conteúdo novo (telas, janelas, menus) tem seus emojis trocados por ícones automaticamente. */
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(a=>{if(a.nodeType==3){if(a.parentNode&&!ICO_SKIP.test(a.parentNode.nodeName)&&EMOJI_TEST.test(a.nodeValue))swapText(a)}else if(a.nodeType==1&&!a.classList.contains('ico'))iconize(a)}))).observe(document.body,{childList:true,subtree:true});
iconize(document.body);
/** Após 200 ms o esqueleto para de animar (evita efeito ruim se o arquivo de ícones demorar). */
setTimeout(()=>document.documentElement.classList.add('ic-late'),200);
/** Atalho para document.querySelector: seleciona um elemento da página pelo seletor CSS. */
const $ = (s) => document.querySelector(s);
/** Gera um identificador aleatório curto, usado como id de cada registro (membro, cota, evento etc.). */
const uid = () => Math.random().toString(36).slice(2, 10);
/** Escapa caracteres especiais de HTML para exibir texto digitado pelo usuário com segurança. */
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
/** Formata um número como moeda brasileira (R$ 1.234,56). */
const brl = (n) =>
  (+n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
/** Converte data ISO (AAAA-MM-DD) para o formato brasileiro DD/MM/AAAA. */
const fd = (d) => (d ? d.split("-").reverse().join("/") : "");
/** Retorna a data de hoje no formato AAAA-MM-DD. */
const hoje = () => {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
};
/** Nomes dos meses em português, usados em títulos e calendário. */
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
/** Tipos de compromisso da agenda (jogo, ebó, trabalho, festa, outro) com nome e classe de cor. */
const TIPOS = {
  jogo: ["Jogo de búzios", "t-jogo"],
  ebo: ["Ebó", "t-ebo"],
  trab: ["Trabalho espiritual", "t-trab"],
  fest: ["Festa / Obrigação", "t-fest"],
  out: ["Outro", "t-out"],
};
/** Armazenamento em memória usado quando o navegador bloqueia o localStorage. */
const mem = {};
const ST = {
  get: (k) => {
    try {
      const v = localStorage.getItem(k);
      if (v !== null) return v;
    } catch (e) {}
    return mem[k] ?? null;
  },
  set: (k, v) => {
    mem[k] = v;
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  },
};
/** Chave com a qual o banco de dados do app é salvo no navegador. */
const KEY = "terreiro_db_v1";
/** Banco de dados do app (membros, mensalidades, cotas, eventos, usuários etc.), carregado do navegador. */
let db;
try {
  db = JSON.parse(ST.get(KEY));
} catch (e) {}
db = db || {
  membros: [],
  mens: {},
  cotas: [],
  despesas: [],
  eventos: [],
  cfg: { mensalidade: 50 },
};
db.cfg = db.cfg || {};
if (db.cfg.v != 2) {
  db.cfg.v = 2;
  db.cfg.mensalidade = 100;
  db.membros.forEach((m) => (m.mensalidade = 100));
}
/** Grava o banco de dados no armazenamento do navegador. */
const save = () => {
  try {
    ST.set(KEY, JSON.stringify(db));
  } catch (e) {
    alert("Não foi possível salvar: " + e.message);
  }
};
/** Devolve o nome de um filho de santo a partir do seu id. */
const nomeM = (id) => (db.membros.find((m) => m.id == id) || {}).nome || "—";
/** Nome da tela (aba) atualmente aberta. */
let view = "painel",
  mesSel = hoje().slice(0, 7),
  calSel = hoje().slice(0, 7),
  agFiltro = "",
  cotaSel = "",
  busca = "";

/** Lista de telas do app: chave e rótulo exibido no menu. */
const VIEWS = [
  ["painel", "Painel"],
  ["membros", "Filhos de Santo"],
  ["mens", "Mensalidades"],
  ["cotas", "Cotas Extras"],
  ["contas", "Prestação de Contas"],
  ["cal", "Calendário"],
  ["agenda", "Agenda"],
  ["galeria", "Galeria"],
  ["ebos", "Ebós"],
  ["bori", "Bori"],
  ["folhas", "Folhas"],
  ["funcao", "Funções"],
  ["afazeres", "Afazeres"],
  ["usuarios", "Usuários"],
  ["conta", "Minha conta"],
];
/** Troca para outra tela e redesenha a página. */
function go(v) {
  view = v;
  render();
}
/** Lista as telas que o usuário logado tem permissão de ver. */
function visiveis() {
  return VIEWS.filter(
    ([k]) =>
      k == "painel" ||
      k == "conta" ||
      k == "afazeres" ||
      (k == "usuarios" ? isPai() : can(k)),
  );
}
/** Ícone (emoji) de cada tela, usado no menu. */
const ICON = {
  painel: "🏠",
  membros: "👥",
  mens: "💰",
  cotas: "🎁",
  contas: "📊",
  cal: "📅",
  agenda: "📖",
  galeria: "🖼",
  usuarios: "🔑",
  conta: "👤",
  ebos: "🧺",
  bori: "🥥",
  folhas: "🌿",
  funcao: "📋",
  afazeres: "✅",
};
/** Calcula se a mensalidade do mês do usuário logado está em dia, pendente ou sem cadastro (bolinha verde/vermelha/cinza). */
function mensStatus() {
  const m = db.membros.find((x) => x.id == cur.memberId);
  if (!m || m.ativo == "nao")
    return { c: "gray", t: "Sem cadastro de mensalidade" };
  const r = (db.mens[hoje().slice(0, 7)] || {})[m.id];
  return r && r.pago
    ? { c: "ok", t: "Em dia", r, m }
    : { c: "bad", t: "Pendente", m };
}
/** Abre o perfil do usuário logado (ou a tela Minha conta se ainda não houver cadastro). */
function meuPerfil() {
  if (cur.memberId) perfil(cur.memberId);
  else go("conta");
}
/** Abre a janela com a situação da mensalidade do mês do usuário logado. */
function mostraMens() {
  const s = mensStatus(),
    mes = hoje().slice(0, 7);
  $("#dlg").innerHTML =
    `<div style="text-align:center"><div class="sdot ${s.c}" style="width:64px;height:64px;margin:0 auto 12px"></div><h2 style="text-align:center">Mensalidade de ${MESES[+mes.slice(5) - 1]}</h2>
  <p style="font-size:20px;font-weight:700;margin:4px 0" class="${s.c == "ok" ? "ok" : s.c == "bad" ? "bad" : "muted"}">${s.t}</p>
  ${s.m ? `<p class="muted">Valor: ${brl(s.m.mensalidade || db.cfg.mensalidade)}${s.r ? " · pago em " + fd(s.r.data) : ""}</p>` : '<p class="muted">Sua conta ainda não está ligada ao seu cadastro. Peça ao pai de santo.</p>'}</div>
  <div class="row" style="margin-top:14px">${can("mens") ? "<button class=\"b\" onclick=\"$('#dlg').close();go('mens')\">Ver mensalidades</button>" : ""}<button class="b g" onclick="$('#dlg').close()">Fechar</button></div>`;
  $("#dlg").showModal();
}
/** Fecha o menu dos três pontinhos. */
function closeMenu() {
  const m = $("#menu");
  if (m) m.hidden = true;
}
/** Abre ou fecha o menu dos três pontinhos, montando as opções conforme as permissões. */
function toggleMenu(e, bar) {
  e.stopPropagation();
  const mn = $("#menu");
  if (!mn.hidden) {
    mn.hidden = true;
    return;
  }
  mn.innerHTML =
    `<div class="mh">👤 <b>${esc(cur.nome)}</b><br><span class="muted">${esc(PAPEL[cur.role] || "")}</span></div>` +
    visiveis()
      .map(
        ([k, l]) =>
          `<button class="${k == view ? "on" : ""}" onclick="go('${k}');closeMenu()">${ICON[k] || "•"} ${l}</button>`,
      )
      .join("") +
    "<hr>" +
    (isPai()
      ? '<button onclick="closeMenu();backup()">⬇ Backup</button><button onclick="closeMenu();document.getElementById(\'imp\').click()">⬆ Restaurar</button>'
      : "") +
    '<button onclick="closeMenu();sair()">⏻ Sair</button>';
  if (bar) {
    mn.style.top = "auto";
    mn.style.bottom = "92px";
  } else {
    mn.style.bottom = "auto";
    mn.style.top =
      Math.max($("header").getBoundingClientRect().bottom, 0) + 6 + "px";
  }
  mn.hidden = false;
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#menu")) closeMenu();
});
/** Atualiza a moldura do app: foto do cabeçalho e barra de atalhos inferior com os avisos (bolinha e contador). */
function chrome() {
  const m = db.membros.find((x) => x.id == cur.memberId),
    av = $("#hav");
  av.style.backgroundImage = m && m.foto ? `url(${m.foto})` : "";
  av.textContent = m && m.foto ? "" : (cur.nome.trim()[0] || "?").toUpperCase();
  const s = mensStatus(),
    it = [["painel", "🏠", "Início"]];
  if (can("cal")) it.push(["cal", "📅", "Calendário"]);
  if (can("agenda")) it.push(["agenda", "📖", "Agenda"]);
  it.push(["afazeres", "✅", "Afazeres", nAf()]);
  $("#bbar").innerHTML =
    '<div class="bi">' +
    it
      .map(
        ([k, i, l, b]) =>
          `<button class="${k == view ? "on" : ""}" onclick="go('${k}')"><span class="ic">${i}${b ? `<span class="bdg">${b}</span>` : ""}</span>${l}</button>`,
      )
      .join("") +
    `<button onclick="mostraMens()"><span class="ic"><span class="sdot ${s.c}"></span></span>Mensalidade</button><button class="mobonly" onclick="toggleMenu(event,1)"><span class="ic">⋮</span>Menu</button></div>`;
}
/** Desenha a tela atual: valida a permissão, atualiza a moldura, injeta o HTML da tela e aplica as restrições. */
function render() {
  if (!cur) return;
  if (!visiveis().some((v) => v[0] == view)) view = "painel";
  chrome();
  $("#app").innerHTML = {
    painel,
    membros,
    mens,
    cotas,
    contas,
    cal,
    agenda,
    galeria,
    usuarios,
    conta,
    ebos,
    bori,
    folhas,
    funcao,
    afazeres,
  }[view]();
  applyPerms();
}

/* ---------- Modal de formulário genérico ---------- */
/** Abre um formulário em janela (modal) genérico a partir de uma lista de campos, com salvar, cancelar e excluir. */
function form(titulo, campos, vals, onSave, onDel) {
  vals = vals || {};
  $("#dlg").innerHTML =
    `<h2>${titulo}</h2><form method="dialog" id="f">` +
    campos
      .map((c) => {
        const v = vals[c.k] ?? c.def ?? "";
        let i;
        if (c.t == "select")
          i = `<select name="${c.k}">${c.o
            .map((o) => {
              const [val, l] = Array.isArray(o) ? o : [o, o];
              return `<option value="${esc(val)}" ${val == v ? "selected" : ""}>${esc(l)}</option>`;
            })
            .join("")}</select>`;
        else if (c.t == "textarea")
          i = `<textarea name="${c.k}" rows="3">${esc(v)}</textarea>`;
        else
          i = `<input name="${c.k}" type="${c.t || "text"}" value="${esc(v)}" ${c.req ? "required" : ""} ${c.t == "number" ? 'step="0.01" min="0"' : ""}>`;
        return `<label>${c.l}${i}</label>`;
      })
      .join("") +
    `<div class="row" style="margin-top:6px"><button class="b" value="ok">Salvar</button><button class="b g" type="button" onclick="$('#dlg').close()">Cancelar</button>${onDel ? '<button class="b r" type="button" id="del">Excluir</button>' : ""}</div></form>`;
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const o = {};
    new FormData($("#f")).forEach((v, k) => (o[k] = v));
    campos.forEach((c) => {
      if (c.t == "number") o[c.k] = +o[c.k] || 0;
    });
    onSave(o);
    save();
    $("#dlg").close();
    render();
  };
  if (onDel)
    $("#del").onclick = () => {
      if (confirm("Excluir este registro?")) {
        onDel();
        save();
        $("#dlg").close();
        render();
      }
    };
  $("#dlg").showModal();
}
/** Abre uma janela simples de informação com botão Fechar. */
function info(html) {
  $("#dlg").innerHTML =
    html +
    `<div style="margin-top:12px"><button class="b g" onclick="$('#dlg').close();render()">Fechar</button></div>`;
  $("#dlg").showModal();
}

/* ---------- Painel ---------- */
/** Tela inicial: números do mês, próximos compromissos, mensalidades pendentes, aniversariantes e Odùs. */
function painel() {
  const ativos = db.membros.filter((m) => m.ativo != "nao");
  const mes = hoje().slice(0, 7),
    reg = db.mens[mes] || {};
  const pagos = ativos.filter((m) => reg[m.id]?.pago);
  const rec = pagos.reduce((s, m) => s + (+reg[m.id].valor || 0), 0);
  const prox = db.eventos
    .filter((e) => e.data >= hoje())
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
    .slice(0, 6);
  const pend = ativos.filter((m) => !reg[m.id]?.pago);
  return `<h2>Painel — ${MESES[+mes.slice(5) - 1]}/${mes.slice(0, 4)}</h2>
  <div class="grid">
   <div class="card stat"><i class="sico">👥</i><b>${ativos.length}</b><span>Filhos de santo ativos</span></div>
   <div class="card stat"><i class="sico">🧾</i><b>${pagos.length}/${ativos.length}</b><span>Mensalidades pagas no mês</span></div>
   <div class="card stat"><i class="sico">💰</i><b>${brl(rec)}</b><span>Recebido no mês</span></div>
   <div class="card stat"><i class="sico">🎁</i><b>${db.cotas.length}</b><span>Cotas extras cadastradas</span></div>
  </div>
  <div class="grid">
   <div class="card"><h3>Próximos compromissos</h3>${prox.length ? prox.map((e) => `<p><span class="tag ${TIPOS[e.tipo][1]}">${TIPOS[e.tipo][0]}</span> <b>${fd(e.data)}</b> ${esc(e.hora)} — ${esc(e.titulo)}</p>`).join("") : '<p class="muted">Nada agendado.</p>'}</div>
   <div class="card"><h3>Mensalidades pendentes</h3>${pend.length ? pend.map((m) => `<p>${esc(m.nome)}</p>`).join("") : '<p class="muted">Todos em dia 🎉</p>'}</div>
  </div>
  ${aniv(mes)}`;
}
/** Monta os quadros de aniversariantes do mês e de Odùs (aniversário de iniciação) do mês. */
function aniv(mes) {
  const mm = mes.slice(5),
    dia = hoje().slice(8);
  const l = db.membros
    .filter((m) => m.ativo != "nao" && m.nasc && m.nasc.slice(5, 7) == mm)
    .sort((a, b) => a.nasc.slice(8).localeCompare(b.nasc.slice(8)));
  const odus = db.membros
    .filter(
      (m) =>
        m.ativo != "nao" &&
        m.iniciado != "nao" &&
        m.feitura &&
        m.feitura.slice(5, 7) == mm,
    )
    .sort((a, b) => a.feitura.slice(8).localeCompare(b.feitura.slice(8)));
  return `<div class="grid">
  <div class="card"><h3>🎂 Aniversariantes do mês</h3>${
    l
      .map((m) => {
        const d = m.nasc.slice(8),
          idade = +mes.slice(0, 4) - +m.nasc.slice(0, 4);
        return `<p><b>${d}/${mm}</b> ${d == dia ? "🎉 " : ""}<a href="#" onclick="perfil('${m.id}');return false">${esc(m.nome)}</a> <span class="muted">${idade} anos${m.orixa ? " · " + esc(m.orixa) : ""}</span></p>`;
      })
      .join("") ||
    '<p class="muted">Nenhum aniversariante este mês (preencha a data de nascimento no cadastro).</p>'
  }</div>
  <div class="card"><h3>🔮 Odùs do mês (tempo de santo)</h3>${
    odus
      .map((m) => {
        const d = m.feitura.slice(8),
          n = +mes.slice(0, 4) - +m.feitura.slice(0, 4);
        return `<p><b>${d}/${mm}</b> ${d == dia ? "🎉 " : ""}<a href="#" onclick="perfil('${m.id}');return false">${esc(m.nome)}</a> <span class="muted">${n > 0 ? n + (n == 1 ? " ano" : " anos") + " de santo" : "iniciação este ano"} · feito(a) em ${fd(m.feitura)}</span></p>`;
      })
      .join("") ||
    '<p class="muted">Nenhum Odù este mês (preencha a data completa da iniciação no cadastro).</p>'
  }</div></div>`;
}
/** Calcula o tempo de santo (anos desde a iniciação) em texto. */
function tempoSanto(f) {
  if (!f) return "";
  const h = hoje();
  let a = +h.slice(0, 4) - +f.slice(0, 4);
  if (h.slice(5) < f.slice(5)) a--;
  return a < 0 ? "" : a + (a == 1 ? " ano" : " anos") + " de santo";
}
/** (Resíduo de versão anterior) Edita o Odù regente do mês; não é mais usada na interface. */
function editOduMes(mes) {
  const o = (db.odus = db.odus || {})[mes] || {};
  form(
    "Odù do mês — " + MESES[+mes.slice(5) - 1],
    [
      { k: "odu", l: "Odù regente do mês" },
      { k: "obs", l: "Mensagem / orientação", t: "textarea" },
    ],
    o,
    (v) => {
      db.odus[mes] = v;
    },
  );
}
/** Abre o perfil de um filho de santo com seus dados e o botão de editar, respeitando as permissões. */
function perfil(id) {
  const m = db.membros.find((x) => x.id == id);
  if (!m) return;
  if (!can("membros") && !(cur && cur.memberId == id)) {
    alert("Sem permissão para ver este perfil.");
    return;
  }
  const r = (l, v) =>
    v ? `<tr><td class="muted">${l}</td><td>${esc(v)}</td></tr>` : "";
  $("#dlg").innerHTML =
    `${avHtml(m, "big")}<h2 style="text-align:center">${esc(m.nome)}</h2><table>${r("Orixá", m.orixa)}${r("Pai de santo", m.pai)}${r("Mãe pequena", m.maepeq)}${r("Pai pequeno", m.paipeq)}${r("Padrinho de Orunkó", m.padrinho)}${r("Jibonã", m.jibona)}${r("Categoria", catMembro(m))}${r("Cargos", (m.cargos || []).join(", "))}${r("Nascimento", fd(m.nasc))}${can("orunko") ? r("Orunkó", m.orunko) : ""}${r("Iniciação", fd(m.feitura))}${r("Tempo de santo", tempoSanto(m.feitura))}${r("Telefone", m.tel)}${r("Endereço", m.end)}${r("Mensalidade", brl(m.mensalidade))}${r("Situação", m.ativo == "nao" ? "Inativo" : "Ativo")}${r("Observações", m.obs)}</table>
  <div class="row" style="margin-top:12px">${can("membros", "edit") || (cur && cur.memberId == m.id) ? `<button class="b" onclick="$('#dlg').close();editMembro('${m.id}')">✎ Editar perfil</button>` : ""}<button class="b g" onclick="$('#dlg').close()">Fechar</button></div>`;
  $("#dlg").showModal();
}

/* ---------- Filhos de santo ---------- */
/** (Resíduo de versão anterior) Lista antiga de cargos; substituída por CARGOS_PADRAO. */
const CARGOS = [
  "Pai/Mãe de santo",
  "Pai/Mãe pequeno(a)",
  "Ogã",
  "Ekede",
  "Iaô",
  "Abiã",
  "Filho(a) de santo",
  "Outro",
];
/** Gera o HTML do círculo com a foto do filho de santo (ou a inicial do nome). */
function avHtml(m, cls) {
  return `<div class="av ${cls || ""}" style="${m.foto ? `background-image:url(${m.foto})` : ""}">${m.foto ? "" : esc((m.nome || "?").trim()[0] || "?").toUpperCase()}</div>`;
}
/** Tela Filhos de Santo: grade de ícones redondos, em vermelho quando a mensalidade do mês está pendente. */
function membros() {
  const mes = hoje().slice(0, 7),
    reg = db.mens[mes] || {};
  const l = db.membros
    .filter((m) =>
      (m.nome + (m.orixa || "")).toLowerCase().includes(busca.toLowerCase()),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome));
  return `<h2>Filhos de Santo</h2><div class="tools"><input placeholder="Buscar por nome ou orixá…" value="${esc(busca)}" oninput="busca=this.value;render();const i=$('.tools input');i.focus();i.setSelectionRange(99,99)"><button class="b" onclick="editMembro()">+ Novo cadastro</button></div>
  <p class="muted"><span style="color:var(--bad)">●</span> Vermelho = mensalidade de ${MESES[+mes.slice(5) - 1]} pendente · <span class="ok">●</span> verde = em dia. Toque na pessoa para abrir os dados.</p>
  <div class="mgrid">${
    l
      .map((m) => {
        const pend = m.ativo != "nao" && !reg[m.id]?.pago;
        return `<div class="mc ${pend ? "pend" : ""} ${m.ativo == "nao" ? "off" : ""}" onclick="perfil('${m.id}')">${avHtml(m)}<b>${esc(m.nome)}</b><span>${esc(m.orixa)}</span><span class="muted">${catCargos(m)}</span></div>`;
      })
      .join("") || '<p class="muted">Nenhum cadastro ainda.</p>'
  }</div>`;
}
/** Cargos iniciais oferecidos no cadastro (Pai/Mãe de santo, Ogã, Ekede etc.). */
const CARGOS_PADRAO = [
  "Pai/Mãe de santo",
  "Pai/Mãe pequeno(a)",
  "Ogã",
  "Ekede",
  "Zelador(a)",
];
/** Calcula quantos anos completos se passaram desde uma data de iniciação. */
function anosSanto(f) {
  const h = hoje();
  let a = +h.slice(0, 4) - +f.slice(0, 4);
  if (h.slice(5) < f.slice(5)) a--;
  return a;
}
/** Define a categoria do filho: Abiã (não iniciado), Iaô/Yawo (menos de 7 anos) ou Egbomi (7 anos ou mais). */
function catMembro(m) {
  if (!m.feitura || m.iniciado == "nao") return "Abiã";
  return anosSanto(m.feitura) < 7 ? "Iaô (Yawo)" : "Egbomi";
}
/** Monta o texto "categoria · cargos" exibido no ícone do filho de santo. */
function catCargos(m) {
  return esc([catMembro(m), ...(m.cargos || [])].join(" · "));
}
/** Formulário de cadastro/edição do filho de santo, com foto, iniciação, cargos e regras de campos restritos. */
function editMembro(id) {
  const lim = !can("membros", "edit");
  if (lim && !(cur && id && cur.memberId == id)) {
    alert("Você não tem permissão para alterar cadastros.");
    return;
  }
  const m = db.membros.find((x) => x.id == id) || {};
  const cargos = (db.cargos = db.cargos || [...CARGOS_PADRAO]);
  const ini = m.iniciado || (m.feitura ? "sim" : "nao"),
    temC = (m.cargos || []).length ? "sim" : "nao";
  const inp = (k, l, t, x) =>
    `<label>${l}<input name="${k}" type="${t || "text"}" value="${esc(m[k] ?? "")}" ${x || ""}></label>`;
  $("#dlg").innerHTML =
    `<h2>${id ? "Editar perfil" : "Novo filho(a) de santo"}</h2><form id="f"><div style="text-align:center"><div class="av big" id="fprev"></div><label>Foto de perfil<input type="file" accept="image/*" id="ffoto"></label></div>
  ${inp("nome", "Nome completo", "text", "required")}${inp("orixa", "Orixá de cabeça")}
  <label>Pai de santo<select name="pai"><option value="">— selecione —</option>${["Roberto", "Marcos"].map((p) => `<option ${m.pai == p ? "selected" : ""}>${p}</option>`).join("")}</select></label>
  <div id="sExtra">${inp("maepeq", "Mãe pequena")}${inp("paipeq", "Pai pequeno")}${inp("padrinho", "Padrinho de Orunkó")}${inp("jibona", "Jibonã")}</div>
  ${inp("nasc", "Data de nascimento", "date")}  <label>Iniciação<select name="iniciado"><option value="sim" ${ini == "sim" ? "selected" : ""}>Sim, é iniciado(a)</option><option value="nao" ${ini == "nao" ? "selected" : ""}>Não é iniciado(a)</option></select></label>
  <div id="sIni">${can("orunko", "edit") ? inp("orunko", "Orunkó") : ""}${inp("feitura", "Data completa da iniciação — dia, mês e ano", "date")}</div>
  <p id="hint" class="muted" style="margin:-4px 0 10px"></p>
  <label>Tem cargo?<select name="temc"><option value="nao" ${temC == "nao" ? "selected" : ""}>Não</option><option value="sim" ${temC == "sim" ? "selected" : ""}>Sim</option></select></label>
  <div id="sCar" style="border:1px solid var(--line);border-radius:7px;padding:8px;margin-bottom:10px"><div id="cl">${cargos.map((c) => `<div><label style="margin:0;color:inherit"><input type="checkbox" style="width:auto" name="cg" value="${esc(c)}" ${(m.cargos || []).includes(c) ? "checked" : ""}> ${esc(c)}</label></div>`).join("")}</div>
   <label style="margin:8px 0 0">Adicionar cargo novo (separe por vírgula)<input name="novo" placeholder="Ex.: Iyakekerê, Babalaô"></label></div>
  ${inp("tel", "Telefone / WhatsApp")}${inp("end", "Endereço")}<p class="muted">Mensalidade: ${brl(db.cfg.mensalidade)} (valor único para todos)</p>
  <label>Situação<select name="ativo"><option value="sim" ${m.ativo != "nao" ? "selected" : ""}>Ativo</option><option value="nao" ${m.ativo == "nao" ? "selected" : ""}>Inativo</option></select></label>
  <label>Observações<textarea name="obs" rows="3">${esc(m.obs)}</textarea></label>
  <div class="row"><button class="b">Salvar</button><button class="b g" type="button" onclick="$('#dlg').close()">Cancelar</button>${id && !lim ? '<button class="b r" type="button" id="del">Excluir</button>' : ""}</div></form>`;
  const F = $("#f"),
    temEx = () =>
      F.iniciado.value == "sim" ||
      (F.temc.value == "sim" &&
        [...F.querySelectorAll("[name=cg]")].some(
          (c) => c.checked && /ogã|ekede/i.test(c.value),
        )),
    upd = () => {
      const s = F.iniciado.value == "sim";
      $("#sExtra").style.display = temEx() ? "" : "none";
      $("#sIni").style.display = s ? "" : "none";
      $("#sCar").style.display = F.temc.value == "sim" ? "" : "none";
      $("#hint").textContent = !s
        ? "Categoria: Abiã"
        : F.feitura.value
          ? "Categoria: " +
            (anosSanto(F.feitura.value) < 7
              ? "Iaô (Yawo) — menos de 7 anos de santo"
              : "Egbomi — 7 anos ou mais de santo") +
            " · " +
            anosSanto(F.feitura.value) +
            " anos"
          : "Informe a data da iniciação para definir Iaô (Yawo) ou Egbomi.";
    };
  F.iniciado.onchange = F.temc.onchange = upd;
  F.feitura.oninput = upd;
  $("#cl").onchange = upd;
  upd();
  if (lim) {
    [
      "orixa",
      "iniciado",
      "feitura",
      "orunko",
      "temc",
      "pai",
      "maepeq",
      "paipeq",
      "padrinho",
      "jibona",
      "ativo",
      "novo",
    ].forEach((k) => F[k] && (F[k].disabled = true));
    F.querySelectorAll("[name=cg]").forEach((c) => (c.disabled = true));
  }
  let foto = m.foto || "";
  const prev = () => {
    const p = $("#fprev");
    p.style.backgroundImage = foto ? `url(${foto})` : "";
    p.textContent = foto ? "" : "📷";
  };
  prev();
  $("#ffoto").onchange = (e) => {
    const fl = e.target.files[0];
    if (!fl) return;
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 240;
        const s = Math.min(im.width, im.height);
        c.getContext("2d").drawImage(
          im,
          (im.width - s) / 2,
          (im.height - s) / 2,
          s,
          s,
          0,
          0,
          240,
          240,
        );
        foto = c.toDataURL("image/jpeg", 0.8);
        prev();
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(fl);
  };
  F.onsubmit = (e) => {
    e.preventDefault();
    const fm = new FormData(F),
      s = fm.get("iniciado") == "sim";
    if (lim) {
      Object.assign(m, {
        foto,
        nome: fm.get("nome"),
        nasc: fm.get("nasc"),
        tel: fm.get("tel"),
        end: fm.get("end"),
        obs: fm.get("obs"),
      });
      save();
      $("#dlg").close();
      render();
      return;
    }
    if (s && !fm.get("feitura")) {
      alert("Informe a data completa da iniciação (dia, mês e ano).");
      return;
    }
    let cg = [];
    if (fm.get("temc") == "sim") {
      cg = fm.getAll("cg");
      fm.get("novo")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((c) => {
          if (!cargos.includes(c)) cargos.push(c);
          if (!cg.includes(c)) cg.push(c);
        });
    }
    const o = {
      foto,
      nome: fm.get("nome"),
      orixa: fm.get("orixa"),
      pai: fm.get("pai"),
      ...Object.fromEntries(
        ["maepeq", "paipeq", "padrinho", "jibona"].map((k) => [
          k,
          temEx() ? fm.get(k) : "",
        ]),
      ),
      nasc: fm.get("nasc"),
      orunko: can("orunko", "edit")
        ? s
          ? fm.get("orunko")
          : ""
        : m.orunko || "",
      iniciado: s ? "sim" : "nao",
      feitura: s ? fm.get("feitura") : "",
      cargos: cg,
      tel: fm.get("tel"),
      end: fm.get("end"),
      mensalidade: db.cfg.mensalidade,
      ativo: fm.get("ativo"),
      obs: fm.get("obs"),
    };
    if (id) Object.assign(m, o);
    else db.membros.push({ id: uid(), ...o });
    save();
    $("#dlg").close();
    render();
  };
  if (id && !lim)
    $("#del").onclick = () => {
      if (confirm("Excluir este cadastro?")) {
        db.membros = db.membros.filter((x) => x.id != id);
        save();
        $("#dlg").close();
        render();
      }
    };
  $("#dlg").showModal();
}

/* ---------- Mensalidades ---------- */
/** Soma ou subtrai meses de um mês no formato AAAA-MM. */
function shiftMes(m, n) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
/** Tela Mensalidades: situação de cada filho no mês, totais e visão do ano. */
function mens() {
  const ativos = db.membros
    .filter((m) => m.ativo != "nao")
    .sort((a, b) => a.nome.localeCompare(b.nome));
  const reg = db.mens[mesSel] || {};
  const rec = ativos.reduce(
    (s, m) => s + (reg[m.id]?.pago ? +reg[m.id].valor : 0),
    0,
  );
  const prev = ativos.reduce((s, m) => s + (+m.mensalidade || 0), 0);
  const ano = mesSel.slice(0, 4);
  return `<h2>Mensalidades</h2><div class="tools"><button class="b g" onclick="mesSel=shiftMes(mesSel,-1);render()">◀</button><b style="min-width:150px;text-align:center">${MESES[+mesSel.slice(5) - 1]} / ${ano}</b><button class="b g" onclick="mesSel=shiftMes(mesSel,1);render()">▶</button>
  <span class="muted">Recebido <b class="ok">${brl(rec)}</b> de ${brl(prev)} · Pendente <b class="bad">${brl(prev - rec)}</b></span></div>
  <div class="card" style="overflow:auto"><table class="hm4"><tr><th>Filho(a) de santo</th><th>Valor</th><th>Status</th><th>Pago em</th><th>Forma</th><th></th></tr>
  ${
    ativos
      .map((m) => {
        const r = reg[m.id];
        return `<tr><td>${esc(m.nome)}</td><td>${brl(r?.valor ?? m.mensalidade)}</td><td>${r?.pago ? '<span class="ok">✔ Pago</span>' : '<span class="bad">Pendente</span>'}</td><td>${fd(r?.data)}</td><td>${esc(r?.forma || "")}</td>
  <td>${r?.pago ? `<button class="b g s" onclick="desfazMens('${m.id}')">Desfazer</button>` : `<button class="b s" onclick="pagaMens('${m.id}')">Registrar pagamento</button>`}</td></tr>`;
      })
      .join("") ||
    '<tr><td colspan="6" class="muted">Cadastre os filhos de santo primeiro.</td></tr>'
  }</table></div>
  <div class="card" style="overflow:auto"><h3>Visão do ano ${ano}</h3><table class="mx"><tr><th>Nome</th>${MESES.map((x) => `<th>${x.slice(0, 3)}</th>`).join("")}</tr>
  ${ativos
    .map(
      (m) =>
        `<tr><td>${esc(m.nome)}</td>${MESES.map((_, i) => {
          const k = ano + "-" + String(i + 1).padStart(2, "0");
          return `<td><span class="dot ${db.mens[k]?.[m.id]?.pago ? "p" : ""}"></span></td>`;
        }).join("")}</tr>`,
    )
    .join("")}</table></div>`;
}
/** Registra o pagamento da mensalidade de um filho no mês selecionado. */
function pagaMens(id) {
  if (!need("mens")) return;
  const m = db.membros.find((x) => x.id == id);
  form(
    "Pagamento — " + m.nome,
    [
      { k: "valor", l: "Valor (R$)", t: "number", def: m.mensalidade },
      { k: "data", l: "Data do pagamento", t: "date", def: hoje() },
      {
        k: "forma",
        l: "Forma",
        t: "select",
        o: ["Pix", "Dinheiro", "Cartão", "Transferência"],
      },
    ],
    {},
    (o) => {
      (db.mens[mesSel] = db.mens[mesSel] || {})[id] = { pago: true, ...o };
    },
  );
}
/** Desfaz o pagamento de uma mensalidade. */
function desfazMens(id) {
  if (!need("mens")) return;
  if (confirm("Desfazer este pagamento?")) {
    delete db.mens[mesSel][id];
    save();
    render();
  }
}

/* ---------- Cotas extras ---------- */
/** Formas de pagamento disponíveis (Pix, Dinheiro, Cartão, Transferência). */
const FORMAS = ["Pix", "Dinheiro", "Cartão", "Transferência"];
/** Copia a chave Pix de uma cota para a área de transferência. */
function copiaPix(id) {
  const k = db.cotas.find((x) => x.id == id).pix;
  const ok = () => alert("Chave Pix copiada: " + k);
  if (navigator.clipboard)
    navigator.clipboard
      .writeText(k)
      .then(ok, () => prompt("Copie a chave Pix:", k));
  else prompt("Copie a chave Pix:", k);
}
/** Soma o valor arrecadado de uma cota. */
const totCota = (c) =>
  Object.values(c.pag || {}).reduce((s, p) => s + (+p.valor || 0), 0);
/** Soma as despesas lançadas em uma cota. */
const gastoCota = (c) =>
  db.despesas
    .filter((d) => d.cota == c.id)
    .reduce((s, d) => s + (+d.valor || 0), 0);
/** Tela Cotas Extras: lista as cotas com valor, prazo, formas de pagamento, quem recebe e Pix. */
function cotas() {
  return `<h2>Cotas Extras</h2><div class="tools"><button class="b" onclick="editCota()">+ Nova cota</button></div>
  ${
    db.cotas
      .map((c) => {
        const n = Object.keys(c.pag || {}).length,
          part = (c.part || []).length;
        return `<div class="card"><div class="row"><div><h3 style="margin:0">${esc(c.titulo)}</h3><div class="muted">${esc(c.desc)}<br>💰 ${brl(c.valor)} por pessoa · 📅 Pagar até ${fd(c.venc) || "—"}${c.venc && c.venc < hoje() && n < part ? ' <b class="bad">(prazo vencido)</b>' : ""}<br>Formas: ${(c.formas || []).join(", ") || "qualquer"}${c.obsp ? " · " + esc(c.obsp) : ""}${c.recebedor || c.pix ? `<br>👤 Pagar para: <b>${esc(c.recebedor) || "—"}</b>${c.pix ? ` · Chave Pix: <b>${esc(c.pix)}</b> <button class="b g s" onclick="copiaPix('${c.id}')">Copiar</button>` : ""}` : ""}<br>Filhos na cota:${(c.part || []).map((x) => esc(nomeM(x))).join(", ") || "nenhum"}</div></div>
  <div style="text-align:right"><b class="ok">${brl(totCota(c))}</b> arrecadado<br><span class="muted">${n}/${part} pagaram</span></div></div>
  <div style="margin-top:8px"><button class="b s" onclick="pagCota('${c.id}')">Controle de pagamentos</button> <button class="b g s" onclick="editCota('${c.id}')">Editar</button> <button class="b g s" onclick="cotaSel='${c.id}';go('contas')">Prestação de contas</button></div></div>`;
      })
      .join("") ||
    '<p class="muted">Nenhuma cota criada. Ex.: cota da festa de Xangô, reforma do barracão…</p>'
  }`;
}
/** Formulário de criação/edição de cota: valor, prazo, formas, recebedor, Pix e participantes. */
function editCota(id) {
  if (!need("cotas")) return;
  const c = db.cotas.find((x) => x.id == id);
  const sel = c
    ? c.part
    : db.membros.filter((m) => m.ativo != "nao").map((m) => m.id);
  $("#dlg").innerHTML =
    `<h2>${c ? "Editar" : "Nova"} cota</h2><form id="f"><label>Título<input name="titulo" required value="${esc(c?.titulo)}"></label><label>Descrição / finalidade<textarea name="desc" rows="2">${esc(c?.desc)}</textarea></label>
  <div class="row"><label>Valor por pessoa (R$)<input name="valor" type="number" step="0.01" min="0" required value="${c?.valor ?? ""}"></label><label>Pagar até (prazo)<input name="venc" type="date" value="${c?.venc || ""}"></label></div>
  <label>Como pode ser pago</label><div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-bottom:8px">${FORMAS.map((x) => `<label style="margin:0;color:inherit"><input type="checkbox" style="width:auto" name="fp" value="${x}" ${(c ? c.formas || [] : FORMAS).includes(x) ? "checked" : ""}> ${x}</label>`).join("")}</div>
  <label>Condições de pagamento (parcelamento, observações)<input name="obsp" placeholder="Ex.: pode dividir em até 3x" value="${esc(c?.obsp)}"></label>
  <div class="row"><label>Pagar para (quem recebe)<input name="recebedor" placeholder="Nome do responsável" value="${esc(c?.recebedor)}"></label><label>Chave Pix<input name="pix" placeholder="CPF, telefone, e-mail ou chave aleatória" value="${esc(c?.pix)}"></label></div>
  <label>Filhos de santo que participam desta cota <button type="button" class="b g s" onclick="document.querySelectorAll('[name=p]').forEach(x=>x.checked=true)">Marcar todos</button> <button type="button" class="b g s" onclick="document.querySelectorAll('[name=p]').forEach(x=>x.checked=false)">Limpar</button></label><div style="max-height:160px;overflow:auto;border:1px solid var(--line);padding:8px;border-radius:7px;margin-bottom:10px">${db.membros.map((m) => `<div><label style="margin:0;color:inherit"><input type="checkbox" style="width:auto" name="p" value="${m.id}" ${sel.includes(m.id) ? "checked" : ""}> ${esc(m.nome)}</label></div>`).join("") || '<span class="muted">Sem cadastros.</span>'}</div>
  <div class="row"><button class="b">Salvar</button><button class="b g" type="button" onclick="$('#dlg').close()">Cancelar</button>${c ? '<button class="b r" type="button" id="del">Excluir</button>' : ""}</div></form>`;
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fm = new FormData($("#f"));
    const o = {
      titulo: fm.get("titulo"),
      desc: fm.get("desc"),
      valor: +fm.get("valor"),
      venc: fm.get("venc"),
      part: fm.getAll("p"),
      formas: fm.getAll("fp"),
      obsp: fm.get("obsp"),
      recebedor: fm.get("recebedor").trim(),
      pix: fm.get("pix").trim(),
    };
    if (c) Object.assign(c, o);
    else db.cotas.push({ id: uid(), pag: {}, ...o });
    save();
    $("#dlg").close();
    render();
  };
  if (c)
    $("#del").onclick = () => {
      if (confirm("Excluir cota e suas despesas?")) {
        db.cotas = db.cotas.filter((x) => x.id != id);
        db.despesas = db.despesas.filter((d) => d.cota != id);
        save();
        $("#dlg").close();
        render();
      }
    };
  $("#dlg").showModal();
}
/** Abre o controle de pagamentos de uma cota (quem pagou e quem está pendente). */
function pagCota(id) {
  const c = db.cotas.find((x) => x.id == id);
  info(
    `<h2>${esc(c.titulo)}</h2><p class="muted">Valor: ${brl(c.valor)} por pessoa${c.recebedor ? " · Pagar para: " + esc(c.recebedor) : ""}${c.pix ? " · Pix: " + esc(c.pix) : ""}</p><table>${(
      c.part || []
    )
      .map((mid) => {
        const p = c.pag[mid];
        return `<tr><td>${esc(nomeM(mid))}</td><td>${p ? `<span class="ok">✔ ${brl(p.valor)} (${fd(p.data)}${p.forma ? " · " + esc(p.forma) : ""})</span>` : '<span class="bad">Pendente</span>'}</td><td>${p ? `<button class="b g s" onclick="cotaPag('${id}','${mid}',0)">Desfazer</button>` : `<button class="b s" onclick="cotaPag('${id}','${mid}',1)">Pago</button>`}</td></tr>`;
      })
      .join("")}</table>`,
  );
}
/** Registra ou desfaz o pagamento de um participante em uma cota. */
function cotaPag(id, mid, pago) {
  if (!need("cotas")) return;
  const c = db.cotas.find((x) => x.id == id);
  if (pago) {
    form(
      "Pagamento — " + nomeM(mid),
      [
        { k: "valor", l: "Valor pago (R$)", t: "number" },
        { k: "data", l: "Data do pagamento", t: "date" },
        {
          k: "forma",
          l: "Forma de pagamento",
          t: "select",
          o: c.formas && c.formas.length ? c.formas : FORMAS,
        },
      ],
      { valor: c.valor, data: hoje() },
      (o) => {
        c.pag[mid] = o;
        setTimeout(() => pagCota(id), 0);
      },
    );
    return;
  }
  delete c.pag[mid];
  save();
  pagCota(id);
}

/* ---------- Prestação de contas ---------- */
/** Tela Prestação de Contas: entradas, despesas e saldo de cada cota, com opção de imprimir. */
function contas() {
  const c = db.cotas.find((x) => x.id == cotaSel) || db.cotas[0];
  const sel = `<div class="tools noprint"><select onchange="cotaSel=this.value;render()">${db.cotas.map((x) => `<option value="${x.id}" ${c && x.id == c.id ? "selected" : ""}>${esc(x.titulo)}</option>`).join("")}</select>${c ? `<button class="b" onclick="editDespesa('','${c.id}')">+ Lançar despesa</button><button class="b g" onclick="window.print()">🖨 Imprimir</button>` : ""}</div>`;
  if (!c)
    return `<h2>Prestação de Contas</h2><p class="muted">Crie uma cota extra primeiro.</p>`;
  const desp = db.despesas
    .filter((d) => d.cota == c.id)
    .sort((a, b) => a.data.localeCompare(b.data));
  const ent = totCota(c),
    sai = gastoCota(c);
  const pend = (c.part || []).filter((m) => !c.pag[m]);
  return `<h2>Prestação de Contas</h2>${sel}
  <div class="card"><h3>${esc(c.titulo)}</h3><p class="muted">${esc(c.desc)}</p>
  <div class="grid"><div class="stat"><b class="ok">${brl(ent)}</b><span>Arrecadado</span></div><div class="stat"><b class="bad">${brl(sai)}</b><span>Gasto</span></div><div class="stat"><b>${brl(ent - sai)}</b><span>Saldo em caixa</span></div></div></div>
  <div class="card"><h3>Entradas — quem pagou</h3><table>${
    Object.entries(c.pag)
      .map(
        ([m, p]) =>
          `<tr><td>${esc(nomeM(m))}</td><td>${fd(p.data)}</td><td>${brl(p.valor)}</td></tr>`,
      )
      .join("") || '<tr><td class="muted">Sem pagamentos.</td></tr>'
  }</table>
  ${pend.length ? `<p class="muted"><b>Pendentes:</b> ${pend.map((m) => esc(nomeM(m))).join(", ")}</p>` : ""}</div>
  <div class="card"><h3>Saídas — despesas</h3><table><tr><th>Data</th><th>Descrição</th><th>Valor</th><th class="noprint"></th></tr>${desp.map((d) => `<tr><td>${fd(d.data)}</td><td>${esc(d.desc)}</td><td>${brl(d.valor)}</td><td class="noprint"><button class="b g s" onclick="editDespesa('${d.id}','${c.id}')">Editar</button></td></tr>`).join("") || '<tr><td colspan="4" class="muted">Sem despesas lançadas.</td></tr>'}</table></div>`;
}
/** Formulário para lançar, editar ou excluir uma despesa de uma cota. */
function editDespesa(id, cota) {
  if (!need("contas")) return;
  const d = db.despesas.find((x) => x.id == id);
  form(
    d ? "Editar despesa" : "Nova despesa",
    [
      { k: "data", l: "Data", t: "date", def: hoje(), req: 1 },
      { k: "desc", l: "Descrição (o que foi comprado/pago)", req: 1 },
      { k: "valor", l: "Valor (R$)", t: "number", req: 1 },
      { k: "obs", l: "Observação / nº do comprovante" },
    ],
    d,
    (o) => {
      if (d) Object.assign(d, o);
      else db.despesas.push({ id: uid(), cota, ...o });
    },
    d &&
      (() => {
        db.despesas = db.despesas.filter((x) => x.id != id);
      }),
  );
}

/* ---------- Eventos: calendário e agenda ---------- */
/** Formulário para criar, editar ou excluir um compromisso da agenda/calendário. */
function editEvento(id, data, tipo) {
  if (!need(view == "agenda" ? "agenda" : "cal")) return;
  const e = db.eventos.find((x) => x.id == id);
  form(
    e ? "Editar compromisso" : "Novo compromisso",
    [
      {
        k: "tipo",
        l: "Tipo",
        t: "select",
        o: Object.entries(TIPOS).map(([k, v]) => [k, v[0]]),
        def: tipo || "fest",
      },
      { k: "titulo", l: "Título", req: 1 },
      { k: "data", l: "Data", t: "date", def: data || hoje(), req: 1 },
      { k: "hora", l: "Horário", t: "time" },
      { k: "pessoa", l: "Filho(a) de santo / consulente / orixá" },
      {
        k: "status",
        l: "Situação",
        t: "select",
        o: ["Agendado", "Realizado", "Cancelado"],
      },
      {
        k: "desc",
        l: "Detalhes (materiais, oferendas, observações)",
        t: "textarea",
      },
    ],
    e,
    (o) => {
      if (e) Object.assign(e, o);
      else db.eventos.push({ id: uid(), ...o });
    },
    e &&
      (() => {
        db.eventos = db.eventos.filter((x) => x.id != id);
      }),
  );
}
/** Tela Calendário do Barracão: grade mensal com os compromissos de cada dia. */
function cal() {
  const [y, m] = calSel.split("-").map(Number);
  const ini = new Date(y, m - 1, 1);
  const start = new Date(y, m - 1, 1 - ini.getDay());
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");
    const evs = db.eventos
      .filter((e) => e.data == k)
      .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
    cells += `<div class="d ${d.getMonth() != m - 1 ? "o" : ""} ${k == hoje() ? "hoje" : ""}" onclick="editEvento('','${k}')"><div class="n">${d.getDate()}</div>${evs.map((e) => `<div class="ev ${TIPOS[e.tipo][1]}" title="${esc(e.titulo)}" onclick="event.stopPropagation();editEvento('${e.id}')">${esc(e.hora)} ${esc(e.titulo)}</div>`).join("")}</div>`;
    if (
      i == 34 &&
      d.getMonth() != m - 1 &&
      new Date(d.getTime() + 864e5).getMonth() != m - 1
    )
      break;
  }
  return `<h2>Calendário do Barracão</h2><div class="tools"><button class="b g" onclick="calSel=shiftMes(calSel,-1);render()">◀</button><b style="min-width:170px;text-align:center">${MESES[m - 1]} / ${y}</b><button class="b g" onclick="calSel=shiftMes(calSel,1);render()">▶</button><button class="b g" onclick="calSel=hoje().slice(0,7);render()">Hoje</button><button class="b" onclick="editEvento()">+ Compromisso</button></div>
  <div class="tools muted">${Object.values(TIPOS)
    .map((t) => `<span class="tag ${t[1]}">${t[0]}</span>`)
    .join(" ")}</div>
  <div class="cal">${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((x) => `<div class="h">${x}</div>`).join("")}${cells}</div><p class="muted">Clique em um dia para marcar um compromisso.</p>`;
}
/** Tela Agenda: lista de jogos, ebós e trabalhos, próximos e anteriores, com filtro por tipo. */
function agenda() {
  const l = db.eventos
    .filter((e) => !agFiltro || e.tipo == agFiltro)
    .sort((a, b) =>
      (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || "")),
    );
  const fut = l.filter((e) => e.data >= hoje()),
    pas = l.filter((e) => e.data < hoje()).reverse();
  const row = (e) =>
    `<tr><td>${fd(e.data)} ${esc(e.hora)}</td><td><span class="tag ${TIPOS[e.tipo][1]}">${TIPOS[e.tipo][0]}</span></td><td><b>${esc(e.titulo)}</b><div class="muted">${esc(e.desc)}</div></td><td>${esc(e.pessoa)}</td><td>${esc(e.status)}</td><td><button class="b g s" onclick="editEvento('${e.id}')">Editar</button></td></tr>`;
  const th =
    "<tr><th>Data</th><th>Tipo</th><th>Título</th><th>Pessoa</th><th>Situação</th><th></th></tr>";
  return `<h2>Agenda — Jogos, Ebós e Trabalhos</h2><div class="tools"><select onchange="agFiltro=this.value;render()"><option value="">Todos os tipos</option>${Object.entries(
    TIPOS,
  )
    .map(
      ([k, v]) =>
        `<option value="${k}" ${agFiltro == k ? "selected" : ""}>${v[0]}</option>`,
    )
    .join("")}</select>
  <button class="b" onclick="editEvento('','','jogo')">+ Jogo</button><button class="b" onclick="editEvento('','','ebo')">+ Ebó</button><button class="b" onclick="editEvento('','','trab')">+ Trabalho</button></div>
  <div class="card" style="overflow:auto"><h3>Próximos</h3><table class="hm4">${th}${fut.map(row).join("") || '<tr><td colspan="6" class="muted">Nada agendado.</td></tr>'}</table></div>
  <div class="card" style="overflow:auto"><h3>Anteriores</h3><table class="hm4">${th}${pas.map(row).join("") || '<tr><td colspan="6" class="muted">—</td></tr>'}</table></div>`;
}

/* ---------- Símbolo do terreiro ---------- */
/* ---------- Galeria (Google Drive) ---------- */
/** Álbum da galeria atualmente selecionado. */
let albSel = "";
/** Extrai o id de uma pasta do Google Drive a partir do link colado. */
const driveId = (l) => {
  l = String(l || "").trim();
  const m =
    l.match(/folders\/([\w-]+)/) ||
    l.match(/[?&]id=([\w-]+)/) ||
    (/^[\w-]{20,}$/.test(l) ? [0, l] : null);
  return m ? m[1] : "";
};
/** Tela Galeria: exibe as fotos de pastas do Google Drive dentro do app. */
function galeria() {
  const al = (db.albuns = db.albuns || []);
  const a = al.find((x) => x.id == albSel) || al[0];
  return `<h2>Galeria de Fotos</h2>
  <div class="tools"><button class="b" onclick="editAlbum()">+ Novo álbum (pasta do Drive)</button></div>
  ${
    al.length
      ? `<div class="tools">${al.map((x) => `<button class="b ${a && x.id == a.id ? "" : "g"}" onclick="albSel='${x.id}';render()">📁 ${esc(x.nome)}</button>`).join("")}</div>
  <div class="card"><div class="tools"><b style="flex:1">${esc(a.nome)}</b>
   <a class="b" style="text-decoration:none" target="_blank" rel="noopener" href="https://drive.google.com/drive/folders/${a.fid}">⬆ Adicionar fotos no Drive</a>
   <button class="b g" onclick="editAlbum('${a.id}')">Editar</button></div>
   <iframe src="https://drive.google.com/embeddedfolderview?id=${a.fid}#grid" style="width:100%;height:70vh;border:1px solid var(--line);border-radius:8px;background:#fff"></iframe>
   <p class="muted">As fotos vêm direto da pasta do Google Drive. Para adicionar ou apagar fotos, use o botão acima: elas aparecem aqui sozinhas.</p></div>`
      : `<div class="card"><p><b>Como ligar ao Google Drive</b></p><ol class="muted"><li>No Google Drive, crie uma pasta (ex.: "Festa de Oyá 2026") e coloque as fotos.</li><li>Clique com o botão direito na pasta → <b>Compartilhar</b> → em "Acesso geral" escolha <b>Qualquer pessoa com o link</b> (só visualizar).</li><li>Copie o link e clique em <b>+ Novo álbum</b> aqui.</li></ol></div>`
  }`;
}
/** Formulário para cadastrar, editar ou remover um álbum (pasta do Drive). */
function editAlbum(id) {
  if (!need("galeria")) return;
  const a = (db.albuns = db.albuns || []).find((x) => x.id == id);
  form(
    a ? "Editar álbum" : "Novo álbum",
    [
      { k: "nome", l: "Nome do álbum", req: 1 },
      {
        k: "link",
        l: "Link da pasta do Google Drive",
        req: 1,
        def: a ? "https://drive.google.com/drive/folders/" + a.fid : "",
      },
    ],
    a && { nome: a.nome },
    (o) => {
      const f = driveId(o.link);
      if (!f) {
        alert("Link inválido. Cole o link da pasta do Google Drive.");
        return;
      }
      if (a) {
        a.nome = o.nome;
        a.fid = f;
      } else {
        const n = { id: uid(), nome: o.nome, fid: f };
        db.albuns.push(n);
        albSel = n.id;
      }
    },
    a &&
      (() => {
        db.albuns = db.albuns.filter((x) => x.id != id);
      }),
  );
}
/* ---------- Backup ---------- */
/** Baixa um arquivo .json com todos os dados do app. */
function backup() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(db)], { type: "application/json" }),
  );
  a.download = "terreiro-backup-" + hoje() + ".json";
  a.click();
}
/** Restaura os dados do app a partir de um arquivo de backup. */
function restore(inp) {
  const f = inp.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d.membros) throw 0;
      if (confirm("Substituir todos os dados atuais pelo backup?")) {
        d.users = d.users || db.users;
        db = d;
        save();
        sair();
      }
    } catch (e) {
      alert("Arquivo inválido.");
    }
  };
  r.readAsText(f);
  inp.value = "";
}
/* ---------- Usuários, login e permissões ---------- */
/** Chave do acesso antigo (usada só para migrar para o sistema de múltiplos usuários). */
const AK = "terreiro_auth_v1";
/** Áreas do app sobre as quais o pai de santo define permissões por usuário. */
const MODS = [
  ["membros", "Filhos de Santo"],
  ["mens", "Mensalidades"],
  ["cotas", "Cotas Extras"],
  ["contas", "Prestação de Contas"],
  ["cal", "Calendário"],
  ["agenda", "Agenda"],
  ["galeria", "Galeria"],
  ["ebos", "Ebós"],
  ["bori", "Bori"],
  ["folhas", "Folhas"],
  ["funcao", "Funções (presença)"],
  ["afazeres", "Afazeres (ver e editar os de todos)"],
  ["orunko", "Orunkó (dado privado)"],
];
/** Ordem numérica dos níveis de permissão (sem acesso, ver, editar). */
const RANK = { none: 0, view: 1, edit: 2 };
/** Perfis prontos de permissão: Pai de santo, Tesouraria, Secretaria e Filho de santo. */
const PRESETS = {
  pai: {
    nome: "Pai/Mãe de santo (acesso total)",
    p: Object.fromEntries(MODS.map(([k]) => [k, "edit"])),
  },
  tes: {
    nome: "Tesouraria",
    p: {
      membros: "view",
      mens: "edit",
      cotas: "edit",
      contas: "edit",
      cal: "view",
      agenda: "view",
      galeria: "view",
      orunko: "none",
    },
  },
  sec: {
    nome: "Secretaria",
    p: {
      membros: "edit",
      mens: "view",
      cotas: "view",
      contas: "none",
      cal: "edit",
      agenda: "edit",
      galeria: "edit",
      orunko: "none",
    },
  },
  filho: {
    nome: "Filho(a) de santo",
    p: {
      membros: "none", mens: "none", cotas: "none", contas: "none",
      cal: "none", agenda: "none", galeria: "none", orunko: "none",
    },
  },
};
/** Cria uma cópia independente de um objeto. */
const clone = (o) => JSON.parse(JSON.stringify(o));
/** Usuário atualmente logado. */
let cur = null;
/** Retorna a lista de usuários cadastrados no banco de dados. */
const users = () => (db.users = db.users || []);
/** Indica se o usuário logado é pai/mãe de santo (acesso total). */
const isPai = () => !!cur && cur.role == "pai";
/** Retorna o nível de permissão (none, view, edit) do usuário logado em uma área. */
const lvl = (m) =>
  !cur ? "none" : isPai() ? "edit" : (cur.perms || {})[m] || "none";
/** Verifica se o usuário logado tem pelo menos um certo nível de permissão em uma área. */
const can = (m, n = "view") => RANK[lvl(m)] >= RANK[n];
/** Exige permissão de edição; mostra aviso e retorna falso se o usuário não tiver. */
function need(mod) {
  if (can(mod, "edit")) return true;
  alert("Você não tem permissão para alterar esta área. Peça ao pai de santo.");
  return false;
}
/** Gera o resumo criptográfico (SHA-256) da senha, para não guardá-la em texto puro. */
async function hash(s) {
  s = "terreiro:" + s;
  try {
    const b = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(s),
    );
    return [...new Uint8Array(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    let h1 = 0xdeadbeef,
      h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 =
      Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 =
      Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
      Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "f" + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
}
/** Migra dados antigos: aplica novos padrões de permissão e converte o acesso único antigo em usuário pai de santo. */
function migrate() {
  if (db.cfg.v3 != 1) {
    db.cfg.v3 = 1;
    users().forEach((x) => {
      if (PRESETS[x.role]) x.perms = clone(PRESETS[x.role].p);
    });
    save();
  }
  if (db.cfg.v4 != 1) {
    db.cfg.v4 = 1;
    users().forEach((x) => {
      if (x.status == "pendente") {
        x.status = "ativo";
        x.perms = clone(PRESETS.filho.p);
      }
    });
    save();
  }
  if (users().length) return;
  try {
    const a = JSON.parse(ST.get(AK));
    if (a && a.u) {
      users().push({
        id: uid(),
        nome: a.u,
        u: a.u,
        h: a.h,
        role: "pai",
        status: "ativo",
        memberId: "",
        perms: clone(PRESETS.pai.p),
      });
      save();
    }
  } catch (e) {}
}
/** Gera um campo de senha com o botão de olho para mostrar ou ocultar o que foi digitado. */
function pwField(label, name, ac, min) {
  return `<label>${label}<div class="pw"><input name="${name}" type="password" autocomplete="${ac}" required minlength="${min}"><button type="button" class="eye" onclick="togglePw(this)" title="Mostrar senha" aria-label="Mostrar senha"><span class="ico skel" data-n="eye"></span></button></div></label>`;
}
/** Alterna um campo de senha entre oculto e visível, trocando o ícone (olho / olho riscado). */
function togglePw(btn) {
  const i = btn.parentNode.querySelector("input"),
    sp = btn.firstElementChild,
    show = i.type == "password";
  i.type = show ? "text" : "password";
  sp.dataset.n = show ? "eye-off" : "eye";
  delete sp.dataset.f;
  sp.classList.add("skel");
  icoFill(sp);
  const t = show ? "Ocultar senha" : "Mostrar senha";
  btn.title = t;
  btn.setAttribute("aria-label", t);
}
/** Mostra a tela de entrada ou de criação de conta e trata o envio do formulário. A conta nova entra direto, sem aprovação e sem nenhuma permissão. */
function showLogin(modo, msg) {
  const first = !users().length;
  modo = first ? "novo" : modo || "entrar";
  document.body.classList.add("locked");
  cur = null;
  $("#login").innerHTML = `<div class="lbox"><div class="logo" style="margin:0 auto 6px;width:120px;height:120px"></div><h2 style="text-align:center">Ilê Asé Tonin Ewe Oya</h2>
  ${first ? '<p class="muted" style="text-align:center">Primeiro acesso: crie o acesso do Pai/Mãe de santo (administrador)</p>' : `<div class="tools" style="justify-content:center"><button class="b ${modo == "entrar" ? "" : "g"}" type="button" onclick="showLogin('entrar')">Entrar</button><button class="b ${modo == "novo" ? "" : "g"}" type="button" onclick="showLogin('novo')">Criar conta</button></div>`}
  <form id="lf">${modo == "novo" ? '<label>Nome completo<input name="nome" required></label>' : ""}<label>Usuário<input name="u" autocomplete="username" required></label>
  ${modo == "novo" ? '<label>Data de nascimento<input name="nasc" type="date" required></label><p class="muted" style="margin:-4px 0 10px">Usada para recuperar a senha caso você esqueça.</p>' : ""}
  ${pwField("Senha", "p", modo == "novo" ? "new-password" : "current-password", modo == "novo" ? 4 : 1)}
  ${modo == "novo" ? pwField("Repita a senha", "p2", "new-password", 4) : ""}
  <p id="lerr" class="${msg ? "ok" : "bad"}" style="min-height:18px;margin:0 0 8px">${esc(msg || "")}</p><button class="b" style="width:100%">${modo == "entrar" ? "Entrar" : first ? "Criar acesso" : "Criar conta"}</button>
  ${modo == "entrar" ? '<p style="text-align:center;margin:12px 0 0"><button type="button" class="lnk" onclick="esqueciSenha()">Esqueci minha senha</button></p>' : ""}</form></div>`;
  $("#login").style.display = "flex";
  iconsReady();
  $("#lf").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData($("#lf")),
      u = f.get("u").trim().toLowerCase(),
      p = f.get("p"),
      err = (t) => {
        $("#lerr").className = "bad";
        $("#lerr").textContent = t;
      };
    if (modo == "entrar") {
      const x = users().find((y) => y.u == u);
      if (!x || (await hash(p)) != x.h)
        return err("Usuário ou senha incorretos.");
      if (x.status == "bloqueado")
        return err("Acesso bloqueado. Fale com o pai de santo.");
      unlock(x);
    } else {
      if (p != f.get("p2")) return err("As senhas não conferem.");
      if (users().some((y) => y.u == u)) return err("Esse usuário já existe.");
      const n = {
        id: uid(),
        nome: f.get("nome").trim(),
        u,
        nasc: f.get("nasc"),
        h: await hash(p),
        role: first ? "pai" : "filho",
        status: "ativo",
        memberId: "",
        perms: clone(PRESETS[first ? "pai" : "filho"].p),
      };
      users().push(n);
      save();
      unlock(n);
    }
  };
}
/** Tentativas erradas de recuperação de senha nesta sessão (limite contra adivinhação da data). */
let tentativasRec = 0;
/** Abre a janela "Esqueci minha senha": confirma usuário e data de nascimento e, se conferir, libera a troca da senha. */
function esqueciSenha() {
  $("#dlg").innerHTML = `<h2>Esqueci minha senha</h2><p class="muted">Confirme o seu usuário e a sua data de nascimento.</p><form id="rf"><label>Usuário<input name="u" required autocomplete="username"></label><label>Data de nascimento<input name="n" type="date" required></label><p id="rerr" class="bad" style="min-height:18px;margin:0 0 8px"></p><div class="row"><button class="b">Confirmar</button><button class="b g" type="button" onclick="$('#dlg').close()">Cancelar</button></div></form>`;
  $("#rf").onsubmit = async (e) => {
    e.preventDefault();
    const err = (t) => ($("#rerr").textContent = t),
      f = new FormData($("#rf")),
      u = f.get("u").trim().toLowerCase(),
      n = f.get("n");
    if (tentativasRec >= 5)
      return err("Muitas tentativas. Peça ao pai de santo para redefinir sua senha.");
    const x = users().find((y) => y.u == u),
      m = x && db.membros.find((z) => z.id == x.memberId),
      nasc = x && (x.nasc || (m && m.nasc));
    if (!x || !nasc || nasc != n) {
      tentativasRec++;
      return err("Usuário ou data de nascimento não conferem. Se a sua conta é antiga e não tem data de nascimento, peça ao pai de santo uma nova senha.");
    }
    if (x.status == "bloqueado")
      return err("Acesso bloqueado. Fale com o pai de santo.");
    novaSenhaModal(x);
  };
  $("#dlg").showModal();
}
/** Segunda etapa da recuperação: define a nova senha (com repetição para confirmar) do usuário já confirmado. */
function novaSenhaModal(x) {
  $("#dlg").innerHTML = `<h2>Nova senha</h2><p class="muted">Olá, ${esc(x.nome)}. Crie a sua nova senha.</p><form id="nf">${pwField("Nova senha", "p", "new-password", 4)}${pwField("Repita a nova senha", "p2", "new-password", 4)}<p id="rerr" class="bad" style="min-height:18px;margin:0 0 8px"></p><div class="row"><button class="b">Salvar nova senha</button><button class="b g" type="button" onclick="$('#dlg').close()">Cancelar</button></div></form>`;
  iconsReady();
  $("#nf").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData($("#nf"));
    if (f.get("p") != f.get("p2"))
      return ($("#rerr").textContent = "As senhas não conferem.");
    x.h = await hash(f.get("p"));
    save();
    $("#dlg").close();
    showLogin("entrar", "Senha alterada! Entre com a nova senha.");
  };
}
/** Pede a data de nascimento a quem ainda não tem uma cadastrada (contas antigas), para que possa recuperar a senha. */
function pedeNasc() {
  if (!cur || cur.nasc) return;
  $("#dlg").innerHTML = `<h2>Data de nascimento</h2><p class="muted">Cadastre a sua data de nascimento. Ela será usada para recuperar a senha, caso você esqueça.</p><form id="df"><label>Data de nascimento<input name="n" type="date" required></label><div class="row"><button class="b">Salvar</button><button class="b g" type="button" onclick="$('#dlg').close()">Agora não</button></div></form>`;
  $("#df").onsubmit = (e) => {
    e.preventDefault();
    cur.nasc = new FormData($("#df")).get("n");
    save();
    $("#dlg").close();
  };
  $("#dlg").showModal();
}/** Conclui o login: define o usuário atual, libera o app e abre o Painel. */
function unlock(x) {
  cur = x;
  view = "painel";
  try {
    sessionStorage.setItem("terreiro_ok", x.id);
  } catch (e) {}
  $("#login").style.display = "none";
  document.body.classList.remove("locked");
  render();
  const mm = db.membros.find((z) => z.id == x.memberId);
  if (!x.nasc && !(mm && mm.nasc)) setTimeout(pedeNasc, 400);
}
/** Encerra a sessão e volta para a tela de entrada. */
function sair() {
  if ($("#dlg").open) $("#dlg").close();
  try {
    sessionStorage.removeItem("terreiro_ok");
  } catch (e) {}
  cur = null;
  showLogin();
}
/** Permite ao usuário logado trocar a própria senha. */
async function trocaSenha() {
  const o = prompt("Senha atual:");
  if (o === null) return;
  if ((await hash(o)) != cur.h) {
    alert("Senha atual incorreta.");
    return;
  }
  const n = prompt("Nova senha (mínimo 4 caracteres):");
  if (!n || n.length < 4) {
    alert("Senha não alterada.");
    return;
  }
  cur.h = await hash(n);
  save();
  alert("Senha alterada.");
}
/* ---------- Ebós, Bori, Folhas (catálogos restritos) ---------- */
/** Guarda o texto da busca de cada catálogo (ebós, bori, folhas). */
const cbusca = {};
/** Configuração dos catálogos Ebós, Bori e Folhas: campos do formulário e como cada cartão é exibido. */
const CAT = {
  ebos: {
    db: "ebos",
    titulo: "Ebós",
    icone: "🧺",
    novo: "Novo ebó",
    campos: () => [
      { k: "nome", l: "Nome do ebó", req: 1 },
      { k: "orixa", l: "Orixá / finalidade" },
      { k: "para", l: "Para quem (filho de santo / consulente)" },
      { k: "data", l: "Data", t: "date" },
      { k: "itens", l: "Itens do ebó (um por linha)", t: "textarea" },
      { k: "obs", l: "Modo de fazer / observações", t: "textarea" },
    ],
    sub: (x) =>
      `<div class="muted">${[x.orixa, x.para && "para " + x.para, x.data && fd(x.data)].filter(Boolean).map(esc).join(" · ")}</div>`,
  },
  bori: {
    db: "boris",
    titulo: "Bori",
    icone: "🥥",
    novo: "Novo bori",
    campos: () => [
      { k: "nome", l: "Título (ex.: Bori de Ana)", req: 1 },
      {
        k: "filho",
        l: "Filho(a) de santo",
        t: "select",
        o: [
          ["", "— não vinculado —"],
          ...db.membros.map((m) => [m.id, m.nome]),
        ],
      },
      { k: "data", l: "Data", t: "date" },
      {
        k: "itens",
        l: "O que vai na mesa de bori (um item por linha)",
        t: "textarea",
      },
      { k: "obs", l: "Observações", t: "textarea" },
    ],
    sub: (x) =>
      `<div class="muted">${[x.filho && nomeM(x.filho), x.data && fd(x.data)].filter(Boolean).map(esc).join(" · ")}</div>`,
  },
  folhas: {
    db: "folhas",
    titulo: "Folhas",
    icone: "🌿",
    novo: "Nova folha",
    campos: () => [
      { k: "nome", l: "Nome da folha", req: 1 },
      { k: "ioruba", l: "Nome em iorubá" },
      { k: "orixa", l: "Orixá(s)" },
      { k: "uso", l: "Para que serve / uso", t: "textarea" },
      { k: "obs", l: "Observações", t: "textarea" },
    ],
    sub: (x) =>
      `<div class="muted">${[x.ioruba, x.orixa].filter(Boolean).map(esc).join(" · ")}</div>${x.uso ? `<p>${esc(x.uso)}</p>` : ""}`,
  },
};
/** Monta a tela de um catálogo (ebós, bori ou folhas) com busca e cartões. */
function catLista(key) {
  const C = CAT[key],
    l = (db[C.db] = db[C.db] || []),
    q = (cbusca[key] || "").toLowerCase();
  const r = l
    .filter((x) => JSON.stringify(x).toLowerCase().includes(q))
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  return `<h2>${C.icone} ${C.titulo}</h2><div class="tools"><input placeholder="Buscar…" value="${esc(cbusca[key] || "")}" oninput="cbusca['${key}']=this.value;render();const i=$('.tools input');i.focus();i.setSelectionRange(99,99)"><button class="b" onclick="editCat('${key}')">+ ${C.novo}</button></div>
  <div class="cgrid">${
    r
      .map(
        (x) =>
          `<div class="card cc" onclick="editCat('${key}','${x.id}')"><h3>${esc(x.nome)}</h3>${C.sub(x)}${
            x.itens
              ? `<ul>${x.itens
                  .split("\n")
                  .filter((s) => s.trim())
                  .map((s) => `<li>${esc(s.trim())}</li>`)
                  .join("")}</ul>`
              : ""
          }${x.obs ? `<p class="muted">${esc(x.obs)}</p>` : ""}</div>`,
      )
      .join("") || '<p class="muted">Nada cadastrado ainda.</p>'
  }</div>`;
}
/** Atalhos que abrem as telas de Ebós, Bori e Folhas (todas usam catLista). */
const ebos = () => catLista("ebos"),
  bori = () => catLista("bori"),
  folhas = () => catLista("folhas");
/** Formulário de criação/edição/exclusão de um registro de catálogo (ebó, bori ou folha). */
function editCat(key, id) {
  if (!need(key)) return;
  const C = CAT[key],
    l = (db[C.db] = db[C.db] || []),
    x = l.find((y) => y.id == id);
  form(
    x ? "Editar" : C.novo,
    C.campos(),
    x,
    (o) => {
      if (x) Object.assign(x, o);
      else l.push({ id: uid(), ...o });
    },
    x &&
      (() => {
        db[C.db] = l.filter((y) => y.id != id);
      }),
  );
}
/* ---------- Funções e assiduidade ---------- */
$("#dlg").addEventListener("close", () => {
  $("#dlg").style.width = "";
});
/** Lista todas as datas entre o primeiro e o último dia de uma função (até 60 dias). */
function dias(a, b) {
  const r = [];
  if (!a) return r;
  const p = (n) => String(n).padStart(2, "0"),
    d = new Date(a + "T12:00:00"),
    e = new Date((b || a) + "T12:00:00");
  for (let i = 0; i < 60 && d <= e; i++) {
    r.push(d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()));
    d.setDate(d.getDate() + 1);
  }
  return r;
}
/** Retorna os filhos de santo ativos em ordem alfabética. */
const ativosM = () =>
  db.membros
    .filter((m) => m.ativo != "nao")
    .sort((a, b) => a.nome.localeCompare(b.nome));
/** Conta os dias de presença de um filho em uma função. */
function presM(f, mid) {
  const dd = dias(f.ini, f.fim),
    pm = (f.pres || {})[mid] || {};
  return dd.filter((d) => pm[d]).length;
}
/** Tela Funções: lista as funções com a presença da turma e a assiduidade de cada filho. */
function funcao() {
  const fs = (db.funcoes = db.funcoes || [])
      .slice()
      .sort((a, b) => b.ini.localeCompare(a.ini)),
    at = ativosM();
  const tot = fs.reduce((s, f) => s + dias(f.ini, f.fim).length, 0);
  const rows = at
    .map((m) => {
      const p = fs.reduce((s, f) => s + presM(f, m.id), 0);
      return { m, p, pct: tot ? Math.round((p * 100) / tot) : 0 };
    })
    .sort((a, b) => b.pct - a.pct || a.m.nome.localeCompare(b.m.nome));
  const cor = (p) =>
    p >= 75 ? "var(--ok)" : p >= 50 ? "var(--gold)" : "var(--bad)";
  return `<h2>Funções e Assiduidade</h2><p class="muted">Funções são os atos em que todos devem estar presentes no barracão, de um ou de vários dias.</p><div class="tools"><button class="b" onclick="editFuncao()">+ Nova função</button></div>
  ${
    fs
      .map((f) => {
        const dd = dias(f.ini, f.fim),
          pres = at.reduce((s, m) => s + presM(f, m.id), 0),
          poss = dd.length * at.length;
        return `<div class="card"><div class="row"><div><h3 style="margin:0">${esc(f.nome)}</h3><div class="muted">📅 ${fd(f.ini)}${f.fim && f.fim != f.ini ? " a " + fd(f.fim) : ""} · ${dd.length} dia${dd.length > 1 ? "s" : ""}${f.obs ? " · " + esc(f.obs) : ""}</div></div><div style="text-align:right"><b style="font-size:20px">${poss ? Math.round((pres * 100) / poss) : 0}%</b> <span class="muted">de presença</span></div></div>
  <div style="margin-top:8px"><button class="b s" onclick="presFuncao('${f.id}')">Marcar presença</button> <button class="b g s" onclick="editFuncao('${f.id}')">Editar</button></div></div>`;
      })
      .join("") || '<p class="muted">Nenhuma função cadastrada.</p>'
  }
  <div class="card" style="overflow:auto"><h3>Assiduidade dos filhos de santo</h3>${tot ? `<table><tr><th>Nome</th><th>Presenças</th><th>Assiduidade</th></tr>${rows.map((r) => `<tr><td>${esc(r.m.nome)}</td><td>${r.p}/${tot} dias</td><td style="min-width:150px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;background:#e8efe7;border-radius:8px;height:10px"><div style="width:${r.pct}%;height:100%;border-radius:8px;background:${cor(r.pct)}"></div></div><b>${r.pct}%</b></div></td></tr>`).join("")}</table>` : '<p class="muted">Cadastre funções e marque as presenças para ver a assiduidade.</p>'}</div>`;
}
/** Formulário de criação/edição/exclusão de uma função (um ou vários dias). */
function editFuncao(id) {
  if (!need("funcao")) return;
  const l = (db.funcoes = db.funcoes || []),
    x = l.find((y) => y.id == id);
  form(
    x ? "Editar função" : "Nova função",
    [
      { k: "nome", l: "Nome da função", req: 1 },
      { k: "ini", l: "Primeiro dia", t: "date", req: 1 },
      { k: "fim", l: "Último dia (deixe vazio se for um dia só)", t: "date" },
      { k: "obs", l: "Observações" },
    ],
    x,
    (o) => {
      if (!o.fim || o.fim < o.ini) o.fim = o.ini;
      if (x) Object.assign(x, o);
      else l.push({ id: uid(), pres: {}, ...o });
    },
    x &&
      (() => {
        db.funcoes = l.filter((y) => y.id != id);
      }),
  );
}
/** Abre a tabela de presença (filho x dia) de uma função, com salvamento automático. */
function presFuncao(id) {
  if (!need("funcao")) return;
  const f = db.funcoes.find((x) => x.id == id),
    dd = dias(f.ini, f.fim),
    at = ativosM();
  $("#dlg").style.width = "min(900px,96vw)";
  $("#dlg").innerHTML =
    `<h2>${esc(f.nome)} — presença</h2><p class="muted">Marque quem esteve presente em cada dia. Salva automaticamente.</p><div style="overflow:auto"><table class="mx"><tr><th>Filho(a) de santo</th>${dd.map((d) => `<th>${d.slice(8)}/${d.slice(5, 7)}<br><button class="b g s" style="padding:1px 6px" onclick="presCol('${f.id}','${d}')" title="Marcar todos presentes neste dia">✔ todos</button></th>`).join("")}<th>Total</th></tr>
  ${at.map((m) => `<tr><td>${esc(m.nome)}</td>${dd.map((d) => `<td><input type="checkbox" style="width:20px;height:20px" ${((f.pres || {})[m.id] || {})[d] ? "checked" : ""} onchange="presMark('${f.id}','${m.id}','${d}',this.checked)"></td>`).join("")}<td><b id="pc-${m.id}">${presM(f, m.id)}/${dd.length}</b></td></tr>`).join("")}</table></div>
  <div style="margin-top:12px"><button class="b" onclick="$('#dlg').close();render()">Concluir</button></div>`;
  $("#dlg").showModal();
}
/** Marca ou desmarca a presença de um filho em um dia de uma função. */
function presMark(fid, mid, d, v) {
  if (!need("funcao")) return;
  const f = db.funcoes.find((x) => x.id == fid);
  f.pres = f.pres || {};
  (f.pres[mid] = f.pres[mid] || {})[d] = v;
  save();
  const c = document.getElementById("pc-" + mid);
  if (c) c.textContent = presM(f, mid) + "/" + dias(f.ini, f.fim).length;
}
/** Marca todos os filhos como presentes em um determinado dia. */
function presCol(fid, d) {
  const f = db.funcoes.find((x) => x.id == fid);
  f.pres = f.pres || {};
  ativosM().forEach((m) => ((f.pres[m.id] = f.pres[m.id] || {})[d] = true));
  save();
  presFuncao(fid);
}
/* ---------- Afazeres ---------- */
/** Filtro atual da tela Afazeres (hoje, próximos ou concluídos). */
let afFiltro = "hoje";
/** Transforma um texto com uma linha por item em uma lista de itens. */
const linhasT = (s) =>
  String(s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
/** Busca, na página de ebós ou de bori, o nome e os itens ligados a um afazer. */
function refInfo(t) {
  if (t.tipo == "ebos") {
    const e = (db.ebos || []).find((x) => x.id == t.ref);
    return e
      ? {
          nome: "Ebó: " + e.nome,
          sub: [e.orixa, e.para && "para " + e.para]
            .filter(Boolean)
            .join(" · "),
          itens: linhasT(e.itens),
          obs: e.obs,
        }
      : { nome: "Ebó removido da página de ebós", itens: [] };
  }
  if (t.tipo == "bori") {
    const b = (db.boris || []).find((x) => x.id == t.ref);
    return b
      ? {
          nome: "Bori: " + b.nome,
          sub: b.filho ? nomeM(b.filho) : "",
          itens: linhasT(b.itens),
          obs: b.obs,
        }
      : { nome: "Bori removido da página de bori", itens: [] };
  }
  return null;
}
/** Indica se um afazer foi designado ao usuário logado. */
const meuAf = (t) => !!cur.memberId && (t.resp || []).includes(cur.memberId);
/** Indica se o usuário logado pode concluir/marcar itens de um afazer (responsável, pai de santo ou quem tem permissão). */
const podeAf = (t) => isPai() || can("afazeres", "edit") || meuAf(t);
/** Lista os afazeres que o usuário logado pode ver (todos, se tiver permissão; senão só os seus). */
function visAf() {
  const l = (db.afazeres = db.afazeres || []);
  return can("afazeres") ? l : l.filter(meuAf);
}
/** Conta os afazeres pendentes de hoje ou atrasados do usuário logado (número na barra inferior). */
function nAf() {
  const h = hoje();
  return (
    (db.afazeres || []).filter((t) => meuAf(t) && !t.done && t.data <= h)
      .length || ""
  );
}
/** Tela Afazeres: tarefas do dia com responsáveis, itens vindos de ebó/bori e estado de conclusão. */
function afazeres() {
  const h = hoje(),
    l = visAf(),
    F = {
      hoje: (t) => t.data == h || (!t.done && t.data < h),
      prox: (t) => !t.done && t.data > h,
      conc: (t) => t.done,
    };
  const n = (k) => l.filter(F[k]).length,
    r = l
      .filter(F[afFiltro])
      .sort((a, b) => a.done - b.done || a.data.localeCompare(b.data));
  const chip = (k, t) =>
    `<button class="b ${afFiltro == k ? "" : "g"}" onclick="afFiltro='${k}';render()">${t} (${n(k)})</button>`;
  return `<h2>✅ Afazeres</h2><p class="muted">${can("afazeres") ? "Tudo o que há para fazer na casa." : "Aqui aparecem os afazeres designados para você."}</p>
  <div class="tools">${chip("hoje", "Hoje")}${chip("prox", "Próximos")}${chip("conc", "Concluídos")}<span style="flex:1"></span><button class="b" onclick="editAfazer()">+ Novo afazer</button></div>
  ${
    r
      .map((t) => {
        const ri = refInfo(t),
          pode = podeAf(t),
          atras = !t.done && t.data < h;
        return `<div class="card af ${t.done ? "done" : ""}"><div class="row"><div><h3 style="margin:0">${esc(t.titulo)}</h3><div class="muted">📅 ${fd(t.data)}${atras ? ' <b class="bad">· atrasado</b>' : ""}<br>👥 ${(t.resp || []).map((x) => esc(nomeM(x))).join(", ") || "<i>sem responsável</i>"}</div></div>
    <div style="text-align:right">${t.done ? '<span class="tag" style="background:var(--ok)">✔ Concluído</span>' : '<span class="tag" style="background:var(--gold)">Pendente</span>'}</div></div>
    ${ri ? `<div class="rbox"><b>${esc(ri.nome)}</b>${ri.sub ? ` <span class="muted">${esc(ri.sub)}</span>` : ""}${ri.itens.length ? `<ul class="chk">${ri.itens.map((it, i) => `<li><label><input type="checkbox" style="width:auto" ${t.chk && t.chk[i] ? "checked" : ""} ${pode && !t.done ? "" : "disabled"} onchange="chkAfazer('${t.id}',${i},this.checked)"> ${esc(it)}</label></li>`).join("")}</ul>` : '<p class="muted">Sem itens cadastrados.</p>'}${ri.obs ? `<p class="muted">${esc(ri.obs)}</p>` : ""}</div>` : ""}
    ${t.obs ? `<p>${esc(t.obs)}</p>` : ""}
    ${t.done ? `<p class="muted">Concluído por <b>${esc(t.doneBy)}</b> em ${fd(t.doneAt)}${isPai() ? " — aguardando a sua conferência" : ""}</p>` : ""}
    <div style="margin-top:8px">${!t.done && pode ? `<button class="b s" onclick="concluiAfazer('${t.id}')">✔ Marcar como concluído</button> ` : ""}${t.done && isPai() ? `<button class="b s" onclick="delAfazer('${t.id}')">✔ Conferido — apagar</button> ` : ""}${t.done ? `<button class="b g s" onclick="reabreAfazer('${t.id}')">Reabrir</button> ` : ""}<button class="b g s" onclick="editAfazer('${t.id}')">Editar</button></div></div>`;
      })
      .join("") || '<p class="muted">Nenhum afazer aqui.</p>'
  }`;
}
/** Formulário de criação/edição de afazer, com tipo (livre, ebó ou bori) e responsáveis. */
function editAfazer(id) {
  if (!need("afazeres")) return;
  const l = (db.afazeres = db.afazeres || []),
    t = l.find((x) => x.id == id) || {};
  $("#dlg").innerHTML =
    `<h2>${id ? "Editar afazer" : "Novo afazer"}</h2><form id="f">
  <label>Título<input name="titulo" value="${esc(t.titulo)}" placeholder="Ex.: Cozinhar o ebó"></label>
  <label>Data<input name="data" type="date" value="${t.data || hoje()}" required></label>
  <label>Tipo<select name="tipo"><option value="livre">Tarefa livre</option><option value="ebos">Ebó (puxa os itens da página de ebós)</option><option value="bori">Bori (puxa a mesa da página de bori)</option></select></label>
  <label id="lref">Qual?<select name="ref"></select></label>
  <label>Quem vai fazer</label><div style="max-height:150px;overflow:auto;border:1px solid var(--line);padding:8px;border-radius:10px;margin-bottom:10px">${
    ativosM()
      .map(
        (m) =>
          `<div><label style="margin:0;color:inherit;font-weight:400"><input type="checkbox" style="width:auto" name="resp" value="${m.id}" ${(t.resp || []).includes(m.id) ? "checked" : ""}> ${esc(m.nome)}</label></div>`,
      )
      .join("") || '<span class="muted">Sem cadastros.</span>'
  }</div>
  <label>Observações<textarea name="obs" rows="2">${esc(t.obs)}</textarea></label>
  <div class="row"><button class="b">Salvar</button><button class="b g" type="button" onclick="$('#dlg').close()">Cancelar</button>${id && isPai() ? '<button class="b r" type="button" id="del">Excluir</button>' : ""}</div></form>`;
  const F = $("#f"),
    fill = () => {
      const tp = F.tipo.value;
      $("#lref").style.display = tp == "livre" ? "none" : "";
      const src =
        tp == "ebos" ? db.ebos || [] : tp == "bori" ? db.boris || [] : [];
      F.ref.innerHTML =
        src
          .map(
            (x) =>
              `<option value="${x.id}" ${x.id == t.ref ? "selected" : ""}>${esc(x.nome)}</option>`,
          )
          .join("") || '<option value="">(nada cadastrado)</option>';
    };
  F.tipo.value = t.tipo || "livre";
  F.tipo.onchange = fill;
  fill();
  F.onsubmit = (e) => {
    e.preventDefault();
    const fm = new FormData(F),
      tp = fm.get("tipo"),
      ref = tp == "livre" ? "" : fm.get("ref");
    if (tp != "livre" && !ref) {
      alert(
        "Cadastre primeiro o " +
          (tp == "ebos" ? "ebó" : "bori") +
          " na página correspondente.",
      );
      return;
    }
    let ti = fm.get("titulo").trim();
    if (!ti) {
      const ri = refInfo({ tipo: tp, ref });
      ti = ri
        ? "Fazer " +
          ri.nome.replace(/^(Ebó|Bori): /, (m) =>
            m == "Ebó: " ? "ebó: " : "bori: ",
          )
        : "Afazer";
    }
    const o = {
      titulo: ti,
      data: fm.get("data"),
      tipo: tp,
      ref,
      resp: fm.getAll("resp"),
      obs: fm.get("obs"),
    };
    if (t.ref != ref) o.chk = {};
    if (id) Object.assign(t, o);
    else l.push({ id: uid(), done: false, chk: {}, ...o });
    save();
    $("#dlg").close();
    render();
  };
  if (id && isPai())
    $("#del").onclick = () => {
      if (confirm("Excluir este afazer?")) {
        db.afazeres = l.filter((x) => x.id != id);
        save();
        $("#dlg").close();
        render();
      }
    };
  $("#dlg").showModal();
}
/** Marca um afazer como concluído pelo usuário responsável. */
function concluiAfazer(id) {
  const t = db.afazeres.find((x) => x.id == id);
  if (!podeAf(t)) {
    alert("Só o responsável pode concluir este afazer.");
    return;
  }
  t.done = true;
  t.doneBy = cur.nome;
  t.doneAt = hoje();
  save();
  render();
}
/** Devolve um afazer concluído para pendente. */
function reabreAfazer(id) {
  if (!(isPai() || can("afazeres", "edit"))) return;
  const t = db.afazeres.find((x) => x.id == id);
  t.done = false;
  delete t.doneBy;
  delete t.doneAt;
  save();
  render();
}
/** Apaga um afazer concluído após a conferência do pai de santo. */
function delAfazer(id) {
  if (!isPai()) return;
  const t = db.afazeres.find((x) => x.id == id);
  if (
    confirm('Você conferiu que "' + t.titulo + '" foi feito? Ele será apagado.')
  ) {
    db.afazeres = db.afazeres.filter((x) => x.id != id);
    save();
    render();
  }
}
/** Marca ou desmarca um item da lista de um afazer. */
function chkAfazer(id, i, v) {
  const t = db.afazeres.find((x) => x.id == id);
  if (!podeAf(t) || t.done) return;
  t.chk = t.chk || {};
  t.chk[i] = v;
  save();
}
/** Nome do papel (Pai/Mãe de santo, Tesouraria etc.) exibido ao usuário. */
const PAPEL = {
  pai: "Pai/Mãe de santo",
  tes: "Tesouraria",
  sec: "Secretaria",
  filho: "Filho(a) de santo",
};
/** Tela Minha conta: mostra o papel do usuário, as permissões e o acesso ao próprio perfil. */
function conta() {
  const m = db.membros.find((x) => x.id == cur.memberId),
    L = { none: "Sem acesso", view: "Só visualizar", edit: "Pode editar" };
  return `<h2>Minha conta</h2>
  <div class="card"><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">${m ? avHtml(m, "big") : ""}<div><h3 style="margin:0;font-size:20px">${esc(cur.nome)}</h3><div class="muted">@${esc(cur.u)}</div>
  <p style="margin:8px 0"><span class="tag ${isPai() ? "t-ebo" : "t-trab"}">${esc(PAPEL[cur.role] || cur.role)}</span></p>
  ${m ? `<button class="b" onclick="perfil('${m.id}')">Ver meu perfil</button> <button class="b g" onclick="editMembro('${m.id}')">✎ Editar meus dados</button> ` : isPai() ? '<button class="b" onclick="criaMeuCadastro()">Criar meu cadastro de filho(a) de santo</button> ' : '<p class="muted">Seu acesso ainda não está ligado a um cadastro. Peça ao pai de santo.</p>'}
  <button class="b g" onclick="trocaSenha()">🔑 Trocar senha</button></div></div></div>
  <div class="card"><h3>O que você pode fazer</h3><table><tr><th>Área</th><th>Permissão</th></tr>${MODS.map(([k, t]) => `<tr><td>${t}</td><td>${L[lvl(k)]}</td></tr>`).join("")}${isPai() ? "<tr><td>Usuários e permissões</td><td>Pode editar</td></tr>" : ""}</table>
  <p class="muted">Todos podem editar os próprios dados pessoais (nome, nascimento, telefone, endereço, foto e observações).</p></div>`;
}
/** Cria o cadastro de filho de santo do próprio pai de santo e o liga à sua conta. */
function criaMeuCadastro() {
  if (!isPai()) return;
  const id = uid();
  db.membros.push({
    id,
    nome: cur.nome,
    ativo: "sim",
    iniciado: "nao",
    cargos: ["Pai/Mãe de santo"],
    mensalidade: db.cfg.mensalidade,
  });
  cur.memberId = id;
  save();
  render();
  editMembro(id);
}
/** Relaciona funções de edição às áreas de permissão, para esconder botões de quem só pode ver. */
const MAPF = {
  editMembro: "membros",
  pagaMens: "mens",
  desfazMens: "mens",
  editCota: "cotas",
  editDespesa: "contas",
  editAlbum: "galeria",
  editFuncao: "funcao",
  presFuncao: "funcao",
  editAfazer: "afazeres",
  reabreAfazer: "afazeres",
};
/** Após desenhar a tela, remove botões e links que o usuário não tem permissão de usar. */
function applyPerms() {
  if (!can("contas"))
    document
      .querySelectorAll("#app button[onclick*=\"go('contas')\"]")
      .forEach((e) => e.remove());
  document.querySelectorAll("#app [onclick]").forEach((e) => {
    const m = (e.getAttribute("onclick") || "").match(/^(\w+)\(/);
    if (!m) return;
    if (
      m[1] == "editMembro" &&
      cur.memberId &&
      e.getAttribute("onclick").includes("'" + cur.memberId + "'")
    )
      return;
    const mod =
      m[1] == "editCat"
        ? (e.getAttribute("onclick").match(/'([^']+)'/) || [])[1]
        : m[1] == "editEvento"
          ? view == "agenda"
            ? "agenda"
            : "cal"
          : MAPF[m[1]];
    if (mod && !can(mod, "edit")) {
      if (e.tagName == "BUTTON") e.remove();
      else e.removeAttribute("onclick");
    }
  });
  document.querySelectorAll('#app a[onclick^="perfil"]').forEach((a) => {
    const id = (a.getAttribute("onclick").match(/'([^']+)'/) || [])[1];
    if (!can("membros") && !(cur.memberId && cur.memberId == id)) {
      const s = document.createElement("span");
      s.innerHTML = a.innerHTML;
      a.replaceWith(s);
    }
  });
  if (view == "painel") {
    if (!can("mens")) {
      document.querySelectorAll("#app .card.stat").forEach((e) => e.remove());
      document.querySelectorAll("#app .card h3").forEach((h) => {
        if (h.textContent.startsWith("Mensalidades pendentes"))
          h.parentElement.remove();
      });
    }
    if (!isPai() && !cur.memberId)
      $("#app").insertAdjacentHTML(
        "afterbegin",
        '<div class="card muted">Seu acesso ainda não está ligado ao seu cadastro de filho(a) de santo. Peça ao pai de santo para vincular, e então você poderá ver e editar o seu perfil.</div>',
      );
  }
}
/* ---------- Usuários (somente pai de santo) ---------- */
/** Tela Usuários (só pai de santo): aprova contas, define perfil, vínculo e situação de cada usuário. */
function usuarios() {
  const l = users()
    .slice()
    .sort(
      (a, b) =>
        (a.status == "pendente" ? 0 : 1) - (b.status == "pendente" ? 0 : 1) ||
        a.nome.localeCompare(b.nome),
    );
  const memb = db.membros.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  return `<h2>Usuários e Permissões</h2><p class="muted">Aprove quem criou conta, escolha o perfil, ligue ao cadastro e ajuste o que cada pessoa pode ver ou editar.</p>
  <div class="card" style="overflow:auto"><table><tr><th>Pessoa</th><th>Perfil</th><th>Cadastro vinculado</th><th>Situação</th><th></th></tr>
  ${l
    .map((x) => {
      const me = x.id == cur.id;
      return `<tr style="${x.status == "pendente" ? "background:#fff7e0" : ""}"><td><b>${esc(x.nome)}</b><div class="muted">@${esc(x.u)}</div></td>
  <td><select ${me ? "disabled" : ""} onchange="setRole('${x.id}',this.value)">${Object.entries(
    PRESETS,
  )
    .map(
      ([k, v]) =>
        `<option value="${k}" ${x.role == k ? "selected" : ""}>${v.nome}</option>`,
    )
    .join("")}</select></td>
  <td><select onchange="setUser('${x.id}','memberId',this.value)"><option value="">— nenhum —</option>${memb.map((m) => `<option value="${m.id}" ${x.memberId == m.id ? "selected" : ""}>${esc(m.nome)}</option>`).join("")}</select></td>
  <td><select ${me ? "disabled" : ""} onchange="setUser('${x.id}','status',this.value)">${[
    ["pendente", "Aguardando aprovação"],
    ["ativo", "Ativo"],
    ["bloqueado", "Bloqueado"],
  ]
    .map(
      ([k, t]) =>
        `<option value="${k}" ${x.status == k ? "selected" : ""}>${t}</option>`,
    )
    .join("")}</select></td>
  <td style="white-space:nowrap">${x.role == "pai" ? "" : `<button class="b g s" onclick="permUser('${x.id}')">Permissões</button> `}<button class="b g s" onclick="resetSenha('${x.id}')">Nova senha</button>${me ? "" : ` <button class="b r s" onclick="delUser('${x.id}')">Excluir</button>`}</td></tr>`;
    })
    .join("")}</table></div>`;
}
/** Encontra um usuário pelo id. */
const uById = (id) => users().find((y) => y.id == id);
/** Altera um campo de um usuário (vínculo ou situação) e redesenha. */
function setUser(id, k, v) {
  uById(id)[k] = v;
  save();
  render();
}
/** Aplica um perfil pronto de permissões a um usuário. */
function setRole(id, r) {
  const x = uById(id);
  x.role = r;
  x.perms = clone(PRESETS[r].p);
  save();
  render();
}
/** Abre a janela para ajustar, área por área, as permissões de um usuário. */
function permUser(id) {
  const x = uById(id);
  $("#dlg").innerHTML =
    `<h2>Permissões — ${esc(x.nome)}</h2><form id="pf">${MODS.map(
      ([k, t]) =>
        `<label>${t}<select name="${k}">${[
          ["none", "Sem acesso"],
          ["view", "Só visualizar"],
          ["edit", "Pode editar"],
        ]
          .map(
            ([v, l]) =>
              `<option value="${v}" ${((x.perms || {})[k] || "none") == v ? "selected" : ""}>${l}</option>`,
          )
          .join("")}</select></label>`,
    ).join(
      "",
    )}<p class="muted">Todos podem editar os próprios dados pessoais no seu perfil (nome, nascimento, telefone, endereço, foto e observações).</p><div class="row"><button class="b">Salvar</button><button class="b g" type="button" onclick="$('#dlg').close()">Cancelar</button></div></form>`;
  $("#pf").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData($("#pf"));
    x.perms = x.perms || {};
    MODS.forEach(([k]) => (x.perms[k] = f.get(k)));
    save();
    $("#dlg").close();
    render();
  };
  $("#dlg").showModal();
}
/** Permite ao pai de santo definir uma nova senha para um usuário. */
async function resetSenha(id) {
  const x = uById(id),
    n = prompt("Nova senha para " + x.nome + " (mínimo 4 caracteres):");
  if (!n || n.length < 4) return;
  x.h = await hash(n);
  save();
  alert("Senha redefinida. Avise a pessoa.");
}
/** Exclui o acesso de um usuário. */
function delUser(id) {
  const x = uById(id);
  if (confirm("Excluir o acesso de " + x.nome + "?")) {
    db.users = users().filter((y) => y.id != id);
    save();
    render();
  }
}
(function () {
  migrate();
  let id = null;
  try {
    id = sessionStorage.getItem("terreiro_ok");
  } catch (e) {}
  const x = users().find((y) => y.id == id && y.status == "ativo");
  if (x) unlock(x);
  else showLogin();
})();
