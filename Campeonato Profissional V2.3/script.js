const STORAGE_KEY = "campeonato_profissional_v22";

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

function validarEtsrutura() {
  if (!data || typeof data !== "object") data = {};
  if (!data.temporadaAtual) data.temporadaAtual = "2026";
  if (!Array.isArray(data.times)) data.times = [];
  if (!Array.isArray(data.jogadores)) data.jogadores = [];
  if (!Array.isArray(data.historico)) data.historico = [];
  if (!data.campeonato || typeof data.campeonato !== "object") {
    data.campeonato = {
      formato: "PONTOS_CORRIDOS",
      faseAtualIndex: 0,
      fases: [],
    };
  }
  if (!Array.isArray(data.campeonato.fases)) data.campeonato.fases = [];

  data.times.forEach((t, idx) => {
    if (!t.id || t.id === "undefined") {
      t.id =
        "t_" + Date.now() + "_" + idx + "_" + Math.floor(Math.random() * 1000);
    } else {
      t.id = String(t.id);
    }
    if (!t.nome) t.nome = "Time " + (idx + 1);
  });
}

validarEtsrutura();

function save() {
  validarEtsrutura();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  render();
}

function mostrarAba(e, id) {
  document
    .querySelectorAll(".tab-content")
    .forEach((x) => x.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((x) => x.classList.remove("active"));
  let el = document.getElementById(id);
  if (el) el.classList.add("active");
  if (e && e.target) e.target.classList.add("active");
}

function alternarVisibilidadeFormatos() {
  const fmt = document.getElementById("formatoCampeonato")?.value;
  const box = document.getElementById("boxTurnos");
  if (box) box.style.display = fmt === "PONTOS_CORRIDOS" ? "block" : "none";
}

function addTeam() {
  let nomeInput = document.getElementById("teamName").value.trim();
  let cidade = document.getElementById("teamCidade").value.trim();
  if (!nomeInput) return alert("Digite o nome do time");

  let nome = nomeInput.charAt(0).toUpperCase() + nomeInput.slice(1);

  let jaExiste = data.times.some(
    (t) => t.nome.toLowerCase() === nome.toLowerCase(),
  );
  if (jaExiste) {
    alert("Esse time já está cadastrado!");
    return;
  }

  const idUnica = "t_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  data.times.push({
    id: idUnica,
    nome,
    cidade,
    pts: 0,
    j: 0,
    v: 0,
    e: 0,
    d: 0,
    gp: 0,
    gc: 0,
    sg: 0,
  });

  document.getElementById("teamName").value = "";
  document.getElementById("teamCidade").value = "";
  save();
}

function removeTeam(id) {
  let idProcurado = String(id);
  let index = data.times.findIndex((x) => String(x.id) === idProcurado);

  if (index === -1) {
    alert("Erro: Time não encontrado na lista.");
    return;
  }

  let t = data.times[index];
  let nomeTime = t.nome || "este time";

  if (!confirm(`Remover ${nomeTime}? Isso vai reiniciar o campeonato atual.`))
    return;

  data.times.splice(index, 1);

  data.jogadores = data.jogadores.filter(
    (j) => String(j.timeId) !== idProcurado,
  );

  if (data.campeonato) {
    data.campeonato.fases = [];
    data.campeonato.faseAtualIndex = 0;
  }

  recalcularTodasEstatisticas();
  save();
}

function obterForma(timeId) {
  let res = [];
  let idStr = String(timeId);
  data.campeonato.fases.forEach((fase) => {
    if (fase.tipo === "PONTOS_CORRIDOS") {
      fase.rodadas.forEach((r) =>
        r.jogos.forEach((j) => {
          if (j.golsCasa === null || j.golsFora === null) return;
          let c = String(j.casa) === idStr,
            f = String(j.fora) === idStr;
          if (!c && !f) return;
          let gt = c ? j.golsCasa : j.golsFora,
            ga = c ? j.golsFora : j.golsCasa;
          res.push(gt > ga ? "V" : gt < ga ? "D" : "E");
        }),
      );
    }
  });
  return res.slice(-5);
}

function abrirPerfil(timeId) {
  let idStr = String(timeId);
  let t = data.times.find((x) => String(x.id) === idStr);
  if (!t) return;

  let forma =
    obterForma(timeId)
      .map((r) => `<span class="bol ${r}">${r}</span>`)
      .join("") || "<span style='color:#999'>sem jogos</span>";
  let jog = data.jogadores.filter((j) => String(j.timeId) === idStr);
  let jogos = [];

  data.campeonato.fases.forEach((fase) => {
    if (fase.tipo === "PONTOS_CORRIDOS") {
      fase.rodadas.forEach((r) =>
        r.jogos.forEach((j) => {
          if (String(j.casa) === idStr || String(j.fora) === idStr)
            jogos.push({ fase: fase.nome, n: r.numero, ...j });
        }),
      );
    } else if (fase.tipo === "MATA_MATA") {
      fase.etapas.forEach((etapa) => {
        etapa.jogos.forEach((j) => {
          if (String(j.casa) === idStr || String(j.fora) === idStr)
            jogos.push({ fase: etapa.nome, n: "", ...j });
        });
      });
    }
  });

  let jogosHTML = jogos.length
    ? jogos
        .map((j) => {
          let c = data.times.find((x) => String(x.id) === String(j.casa)) || {
            nome: j.casaPlaceholder || "A definir",
          };
          let f = data.times.find((x) => String(x.id) === String(j.fora)) || {
            nome: j.foraPlaceholder || "A definir",
          };
          let pl =
            j.golsCasa !== null ? `${j.golsCasa} x ${j.golsFora}` : "— x —";
          return `<div class="rodada" style="margin:6px 0;padding:10px">${j.fase} ${j.n ? "Rod." + j.n : ""}: ${c.nome} ${pl} ${f.nome}</div>`;
        })
        .join("")
    : "<p>Sem jogos registrados</p>";

  document.getElementById("conteudoPerfil").innerHTML = `
    <h2 style="text-align:center;color:#22c55e;margin-bottom:16px">${t.nome}</h2>
    ${t.cidade ? `<p style="text-align:center;color:#8b949e">${t.cidade}</p>` : ""}
    <p class="destaque">📊 Resumo Geral na Temporada</p>
    <p>Pontos: ${t.pts} | Jogos: ${t.j} | V: ${t.v} | E: ${t.e} | D: ${t.d}</p>
    <p>GP: ${t.gp} | GC: ${t.gc} | SG: ${t.sg}</p>
    <p>Forma: ${forma}</p><br>
    <p class="destaque">👟 Artilheiros do Time</p>
    ${jog.length ? jog.map((j) => `<p>• ${j.nome} — ${j.gols} gols</p>`).join("") : "<p>Sem jogadores</p>"}<br>
    <p class="destaque">📋 Histórico de Jogos</p>${jogosHTML}
  `;
  mostrarAba(
    { target: document.querySelector('[onclick*="perfilTime"]') },
    "perfilTime",
  );
}

function gerarCampeonatoCompleto() {
  validarEtsrutura();

  if (data.times.length < 2)
    return alert("Cadastre pelo menos 2 times diferentes!");

  let fmt = document.getElementById("formatoCampeonato").value;
  data.campeonato.formato = fmt;
  data.campeonato.faseAtualIndex = 0;
  data.campeonato.fases = [];

  if (fmt === "PONTOS_CORRIDOS") {
    let turnos = document.getElementById("opcaoTurnos").value;
    data.campeonato.fases.push(
      criarFasePontosCorridos("Fase Única", data.times, turnos),
    );
  } else if (fmt === "MATA_MATA") {
    data.campeonato.fases.push(
      criarFaseMataMata("Mata-Mata Principal", data.times),
    );
  } else if (fmt === "MISTO") {
    data.campeonato.fases.push(
      criarFaseGruposMisto("Fase de Grupos", data.times),
    );
  }

  recalcularTodasEstatisticas();
  save();
}

function criarFasePontosCorridos(
  nomeFase,
  listaTimes,
  turnos,
  grupoNome = null,
) {
  let t = [...listaTimes];

  if (t.length % 2 !== 0) {
    t.push({ id: "FOLGA", nome: "Folga" });
  }

  let totalTimes = t.length;
  let totalRodadas = totalTimes - 1;
  let metade = totalTimes / 2;
  let rodadas = [];

  for (let r = 0; r < totalRodadas; r++) {
    let jogos = [];

    for (let i = 0; i < metade; i++) {
      let casa = t[i];
      let fora = t[totalTimes - 1 - i];

      if (casa.id !== "FOLGA" && fora.id !== "FOLGA" && casa.id !== fora.id) {
        jogos.push({
          id: "j_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
          casa: casa.id,
          fora: fora.id,
          golsCasa: null,
          golsFora: null,
          grupo: grupoNome,
        });
      }
    }

    if (jogos.length > 0) {
      rodadas.push({ numero: r + 1, jogos });
    }

    t = [t[0], t[totalTimes - 1], ...t.slice(1, totalTimes - 1)];
  }

  if (turnos == "2") {
    let t1 = [...rodadas];
    rodadas.push(
      ...t1.map((r, i) => ({
        numero: t1.length + i + 1,
        jogos: r.jogos.map((j) => ({
          id: "j_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
          casa: j.fora,
          fora: j.casa,
          golsCasa: null,
          golsFora: null,
          grupo: grupoNome,
        })),
      })),
    );
  }

  return {
    id: "fase_" + Date.now(),
    nome: nomeFase,
    tipo: "PONTOS_CORRIDOS",
    concluida: false,
    rodadas: rodadas,
  };
}

function criarFaseGruposMisto(nomeFase, listaTimes) {
  let sorteados = [...listaTimes].sort(() => Math.random() - 0.5);
  let timesPorGrupo = 4;
  let numGrupos = Math.max(1, Math.floor(sorteados.length / timesPorGrupo));

  let grupos = {};
  for (let i = 0; i < numGrupos; i++) {
    let letra = String.fromCharCode(65 + i);
    grupos[`Grupo ${letra}`] = [];
  }

  sorteados.forEach((time, index) => {
    let letra = String.fromCharCode(65 + (index % numGrupos));
    grupos[`Grupo ${letra}`].push(time);
  });

  let todasRodadas = [];
  for (let [nomeGrp, membros] of Object.entries(grupos)) {
    let faseG = criarFasePontosCorridos(nomeGrp, membros, "1", nomeGrp);
    faseG.rodadas.forEach((r) => {
      todasRodadas.push({ numero: r.numero, grupo: nomeGrp, jogos: r.jogos });
    });
  }

  return {
    id: "fase_grupos",
    nome: nomeFase,
    tipo: "PONTOS_CORRIDOS",
    concluida: false,
    grupos: grupos,
    rodadas: todasRodadas,
  };
}

function criarFaseMataMata(nomeFase, listaTimes) {
  let n = listaTimes.length;
  let etapasNomes = [];

  if (n > 8) etapasNomes.push("Oitavas de Final");
  if (n > 4) etapasNomes.push("Quartas de Final");
  if (n > 2) etapasNomes.push("Semifinal");
  etapasNomes.push("Grande Final");

  let sorteados = [...listaTimes].sort(() => Math.random() - 0.5);
  let etapas = [];

  let jogosPrimeira = [];
  let numJogosPrimeira = Math.pow(2, etapasNomes.length - 1);

  for (let i = 0; i < numJogosPrimeira; i++) {
    let c = sorteados[i * 2];
    let f = sorteados[i * 2 + 1];
    jogosPrimeira.push({
      id: `m_${0}_${i}`,
      casa: c ? c.id : null,
      fora: f ? f.id : null,
      casaPlaceholder: c ? null : "A definir",
      foraPlaceholder: f ? null : "A definir",
      golsCasa: null,
      golsFora: null,
      vencedor: null,
    });
  }
  etapas.push({ nome: etapasNomes[0], jogos: jogosPrimeira });

  for (let e = 1; e < etapasNomes.length; e++) {
    let numJogos = Math.pow(2, etapasNomes.length - 1 - e);
    let jogos = [];
    for (let i = 0; i < numJogos; i++) {
      jogos.push({
        id: `m_${e}_${i}`,
        casa: null,
        fora: null,
        casaPlaceholder: `Vencedor Jogo ${i * 2 + 1} (${etapasNomes[e - 1]})`,
        foraPlaceholder: `Vencedor Jogo ${i * 2 + 2} (${etapasNomes[e - 1]})`,
        golsCasa: null,
        golsFora: null,
        vencedor: null,
      });
    }
    etapas.push({ nome: etapasNomes[e], jogos: jogos });
  }

  return {
    id: "fase_mm_" + Date.now(),
    nome: nomeFase,
    tipo: "MATA_MATA",
    concluida: false,
    etapas: etapas,
  };
}

function promoverGruposParaMataMata() {
  let faseGrupos = data.campeonato.fases[0];
  let classificados = [];

  for (let [nomeGrupo, membros] of Object.entries(faseGrupos.grupos)) {
    let tabelaGrupo = calcularTabelaClassificacao(membros, faseGrupos.rodadas);
    if (tabelaGrupo[0]) classificados.push(tabelaGrupo[0]);
    if (tabelaGrupo[1]) classificados.push(tabelaGrupo[1]);
  }

  if (classificados.length < 2)
    return alert("Não há classificados suficientes.");

  let faseMataMata = criarFaseMataMata("Fase Final (Mata-Mata)", classificados);
  data.campeonato.fases.push(faseMataMata);
  data.campeonato.faseAtualIndex = 1;
  faseGrupos.concluida = true;

  save();
  alert("🎉 Classificados promovidos com sucesso para a Fase Final!");
}

function calcularTabelaClassificacao(listaTimes, rodadas) {
  let stats = listaTimes.map((t) => ({
    ...t,
    pts: 0,
    j: 0,
    v: 0,
    e: 0,
    d: 0,
    gp: 0,
    gc: 0,
    sg: 0,
  }));

  rodadas.forEach((r) => {
    r.jogos.forEach((j) => {
      if (j.golsCasa === null || j.golsFora === null) return;
      let c = stats.find((x) => String(x.id) === String(j.casa));
      let f = stats.find((x) => String(x.id) === String(j.fora));
      if (!c || !f) return;

      c.j++;
      f.j++;
      c.gp += j.golsCasa;
      c.gc += j.golsFora;
      f.gp += j.golsFora;
      f.gc += j.golsCasa;

      if (j.golsCasa > j.golsFora) {
        c.v++;
        c.pts += 3;
        f.d++;
      } else if (j.golsCasa < j.golsFora) {
        f.v++;
        f.pts += 3;
        c.d++;
      } else {
        c.e++;
        f.e++;
        c.pts++;
        f.pts++;
      }
    });
  });

  stats.forEach((t) => (t.sg = t.gp - t.gc));
  return stats.sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
}

function recalcularTodasEstatisticas() {
  validarEtsrutura();
  data.times.forEach((t) => {
    t.pts = t.j = t.v = t.e = t.d = t.gp = t.gc = t.sg = 0;
  });

  data.campeonato.fases.forEach((fase) => {
    if (fase.tipo === "PONTOS_CORRIDOS") {
      fase.rodadas.forEach((r) =>
        r.jogos.forEach((j) => {
          if (j.golsCasa === null || j.golsFora === null) return;
          let c = data.times.find((x) => String(x.id) === String(j.casa));
          let f = data.times.find((x) => String(x.id) === String(j.fora));
          if (!c || !f) return;
          c.j++;
          f.j++;
          c.gp += j.golsCasa;
          c.gc += j.golsFora;
          f.gp += j.golsFora;
          f.gc += j.golsCasa;

          if (j.golsCasa > j.golsFora) {
            c.v++;
            c.pts += 3;
            f.d++;
          } else if (j.golsCasa < j.golsFora) {
            f.v++;
            f.pts += 3;
            c.d++;
          } else {
            c.e++;
            f.e++;
            c.pts++;
            f.pts++;
          }
        }),
      );
    } else if (fase.tipo === "MATA_MATA") {
      fase.etapas.forEach((etapa) => {
        etapa.jogos.forEach((j) => {
          if (j.golsCasa === null || j.golsFora === null) return;
          let c = data.times.find((x) => String(x.id) === String(j.casa));
          let f = data.times.find((x) => String(x.id) === String(j.fora));
          if (c) {
            c.j++;
            c.gp += j.golsCasa;
            c.gc += j.golsFora;
          }
          if (f) {
            f.j++;
            f.gp += j.golsFora;
            f.gc += j.golsCasa;
          }
          if (c && f) {
            if (j.golsCasa > j.golsFora) {
              c.v++;
              c.pts += 3;
              f.d++;
            } else if (j.golsCasa < j.golsFora) {
              f.v++;
              f.pts += 3;
              c.d++;
            } else {
              c.e++;
              f.e++;
              c.pts++;
              f.pts++;
            }
          }
        });
      });
    }
  });

  data.times.forEach((t) => (t.sg = t.gp - t.gc));
}

function definirJogoPontosCorridos(faseIdx, rodadaIdx, jogoIdx) {
  let jogo = data.campeonato.fases[faseIdx].rodadas[rodadaIdx].jogos[jogoIdx];
  let gc = +prompt("Gols do mandante:", jogo.golsCasa ?? "");
  let gf = +prompt("Gols do visitante:", jogo.golsFora ?? "");
  if (isNaN(gc) || isNaN(gf) || gc < 0 || gf < 0)
    return alert("Resultado inválido");
  jogo.golsCasa = gc;
  jogo.golsFora = gf;
  recalcularTodasEstatisticas();
  save();
}

function definirJogoMataMata(faseIdx, etapaIdx, jogoIdx) {
  let etapa = data.campeonato.fases[faseIdx].etapas[etapaIdx];
  let jogo = etapa.jogos[jogoIdx];

  if (!jogo.casa || !jogo.fora)
    return alert("Aguardando definição dos times nesta chave.");

  let gc = +prompt("Gols do time da casa:", jogo.golsCasa ?? "");
  let gf = +prompt("Gols do visitante:", jogo.golsFora ?? "");
  if (isNaN(gc) || isNaN(gf) || gc < 0 || gf < 0)
    return alert("Resultado inválido");

  if (gc === gf) {
    let pen = prompt(
      "Empate! Quem venceu nos pênaltis? Digite C para Casa ou F para Fora:",
    ).toUpperCase();
    if (pen === "C") gc += 0.1;
    else if (pen === "F") gf += 0.1;
    else return alert("Definição de pênaltis cancelada.");
  }

  jogo.golsCasa = Math.floor(gc);
  jogo.golsFora = Math.floor(gf);
  let vencedorId = gc > gf ? jogo.casa : jogo.fora;
  jogo.vencedor = vencedorId;

  let proximaEtapa = data.campeonato.fases[faseIdx].etapas[etapaIdx + 1];
  if (proximaEtapa) {
    let proximoJogoIdx = Math.floor(jogoIdx / 2);
    let eLadoCasa = jogoIdx % 2 === 0;
    if (eLadoCasa) {
      proximaEtapa.jogos[proximoJogoIdx].casa = vencedorId;
    } else {
      proximaEtapa.jogos[proximoJogoIdx].fora = vencedorId;
    }
  }

  recalcularTodasEstatisticas();
  save();
}

function addJogador() {
  let n = document.getElementById("jogadorNome").value.trim(),
    g = +document.getElementById("jogadorGols").value,
    t = document.getElementById("jogadorTime").value;
  if (!n || !t) return alert("Preencha todos os campos");
  data.jogadores.push({ id: Date.now(), nome: n, gols: g, timeId: t });
  document.getElementById("jogadorNome").value = "";
  document.getElementById("jogadorGols").value = "";
  save();
}

function delJogador(id) {
  data.jogadores = data.jogadores.filter((j) => j.id !== id);
  save();
}

function encerrarTemporada() {
  if (!data.campeonato.fases.length)
    return alert("Nenhum torneio em andamento.");
  let tabela = [...data.times].sort(
    (a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp,
  );
  if (!tabela.length) return alert("Sem times");

  let art = [...data.jogadores].sort((a, b) => b.gols - a.gols)[0];
  let camp = tabela[0],
    ma = [...data.times].sort((a, b) => b.gp - a.gp)[0],
    md = [...data.times].sort((a, b) => a.gc - b.gc)[0];

  data.historico.unshift({
    temporada: data.temporadaAtual,
    dataFim: new Date().toLocaleString(),
    campeao: { nome: camp.nome },
    vice: tabela[1] ? { nome: tabela[1].nome } : null,
    artilheiro: art ? { nome: art.nome, gols: art.gols } : null,
    melhorAtaque: { nome: ma.nome, gols: ma.gp },
    melhorDefesa: { nome: md.nome, gols: md.gc },
  });

  data.temporadaAtual =
    document.getElementById("novaTemporadaNome").value.trim() ||
    (+data.temporadaAtual + 1).toString();
  data.times.forEach((t) => {
    t.pts = t.j = t.v = t.e = t.d = t.gp = t.gc = t.sg = 0;
  });
  data.campeonato.fases = [];
  data.jogadores = [];
  save();
  alert("Temporada encerrada com sucesso!");
}

function exportarDados() {
  let a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  a.download = `campeonato_v22_${data.temporadaAtual}.json`;
  a.click();
}

function importarDados() {
  let arq = document.getElementById("arquivoImportar").files[0];
  if (!arq) return alert("Escolha um arquivo");
  let r = new FileReader();
  r.onload = (e) => {
    try {
      let d = JSON.parse(e.target.result);
      if (confirm("Substituir todos os dados do sistema?")) {
        data = d;
        save();
        alert("Importado com sucesso!");
      }
    } catch {
      alert("Arquivo JSON inválido.");
    }
  };
  r.readAsText(arq);
}

function comecarNovo() {
  if (confirm("Apagar todos os dados e começar do zero?")) {
    localStorage.removeItem(STORAGE_KEY);
    data = {
      temporadaAtual: "2026",
      times: [],
      jogadores: [],
      historico: [],
      campeonato: { formato: "PONTOS_CORRIDOS", faseAtualIndex: 0, fases: [] },
    };
    save();
  }
}

function render() {
  validarEtsrutura();

  let fmtSelect = document.getElementById("formatoCampeonato");
  if (fmtSelect) fmtSelect.value = data.campeonato.formato || "PONTOS_CORRIDOS";
  alternarVisibilidadeFormatos();

  let eNomeTemp = document.getElementById("nomeTemporadaAtual");
  let eAtualTemp = document.getElementById("atualTemporada");
  if (eNomeTemp) eNomeTemp.textContent = data.temporadaAtual;
  if (eAtualTemp) eAtualTemp.textContent = data.temporadaAtual;

  let totalJogos = 0,
    jogosRealizados = 0,
    golsTotais = 0;

  data.campeonato.fases.forEach((fase) => {
    if (fase.tipo === "PONTOS_CORRIDOS") {
      fase.rodadas.forEach((r) =>
        r.jogos.forEach((j) => {
          totalJogos++;
          if (j.golsCasa !== null) {
            jogosRealizados++;
            golsTotais += j.golsCasa + j.golsFora;
          }
        }),
      );
    } else if (fase.tipo === "MATA_MATA") {
      fase.etapas.forEach((e) =>
        e.jogos.forEach((j) => {
          totalJogos++;
          if (j.golsCasa !== null) {
            jogosRealizados++;
            golsTotais += j.golsCasa + j.golsFora;
          }
        }),
      );
    }
  });

  let tabelaGeral = [...data.times].sort(
    (a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp,
  );
  let artilheirosOrd = [...data.jogadores].sort((a, b) => b.gols - a.gols);

  if (document.getElementById("s-times"))
    document.getElementById("s-times").textContent = data.times.length;
  if (document.getElementById("s-jogos"))
    document.getElementById("s-jogos").textContent = totalJogos;
  if (document.getElementById("s-real"))
    document.getElementById("s-real").textContent = jogosRealizados;
  if (document.getElementById("s-gols"))
    document.getElementById("s-gols").textContent = golsTotais;
  if (document.getElementById("s-lider"))
    document.getElementById("s-lider").textContent =
      tabelaGeral[0]?.nome || "—";
  if (document.getElementById("s-artilheiro")) {
    document.getElementById("s-artilheiro").textContent = artilheirosOrd[0]
      ? `${artilheirosOrd[0].nome} (${artilheirosOrd[0].gols})`
      : "—";
  }

  let grid = document.getElementById("timesGrid");
  if (grid) {
    grid.innerHTML = tabelaGeral
      .map(
        (t, i) => `
      <div class="time-card" onclick="abrirPerfil('${t.id}')">
        <div class="pos">${i + 1}º</div>
        <div class="nome">${t.nome}</div>
        ${t.cidade ? `<div style="font-size:13px;color:#8b949e">${t.cidade}</div>` : ""}
        <div class="pts">${t.pts} pts • ${t.j} jogos</div>
        <div style="font-size:13px;color:#9ca3af;margin-top:4px">V:${t.v} E:${t.e} D:${t.d}</div>
        <button class="del" style="margin-top:12px" onclick="event.stopPropagation(); removeTeam('${t.id}')">Excluir</button>
      </div>
    `,
      )
      .join("");
  }

  renderTabelasAba();
  renderRodadasAba();

  let jogSelect = document.getElementById("jogadorTime");
  if (jogSelect) {
    jogSelect.innerHTML =
      `<option value="">-- Time --</option>` +
      data.times
        .map((t) => `<option value="${t.id}">${t.nome}</option>`)
        .join("");
  }

  let rankArt = document.getElementById("rankingArtilheiros");
  if (rankArt) {
    rankArt.innerHTML = artilheirosOrd
      .map((j, i) => {
        let t = data.times.find((x) => String(x.id) === String(j.timeId));
        return `<tr><td>${i + 1}</td><td>${j.nome}</td><td>${t?.nome || "-"}</td><td>${j.gols}</td><td><button class="del" onclick="delJogador(${j.id})">Excluir</button></td></tr>`;
      })
      .join("");
  }

  let listHist = document.getElementById("listaHistorico");
  if (listHist) {
    listHist.innerHTML = data.historico.length
      ? data.historico
          .map(
            (h) => `
          <div class="historico-item">
            <h4 class="destaque">🏆 Temporada ${h.temporada}</h4>
            <p>Campeão: ${h.campeao.nome}</p>
            <p>Vice: ${h.vice?.nome || "-"}</p>
            <p>Artilheiro: ${h.artilheiro ? h.artilheiro.nome + " (" + h.artilheiro.gols + ")" : "-"}</p>
            <p>Ataque: ${h.melhorAtaque.nome} | Defesa: ${h.melhorDefesa.nome}</p>
            <small>${h.dataFim}</small>
          </div>
        `,
          )
          .join("")
      : "<p style='color:#999'>Nenhuma temporada encerrada</p>";
  }
}

function renderTabelasAba() {
  let container = document.getElementById("conteudoTabelas");
  if (!container) return;

  if (!data.campeonato.fases.length) {
    container.innerHTML = `<div class="card"><p style="color:var(--muted)">Nenhum campeonato iniciado. Vá até 'Rodadas & Chaves' e clique em 'Iniciar Torneio'.</p></div>`;
    return;
  }

  let html = "";
  data.campeonato.fases.forEach((fase) => {
    if (fase.tipo === "PONTOS_CORRIDOS") {
      if (fase.grupos) {
        for (let [nomeGrupo, membros] of Object.entries(fase.grupos)) {
          let tabG = calcularTabelaClassificacao(membros, fase.rodadas);
          html += `
            <div class="card">
              <span class="fase-badge">${fase.nome} — ${nomeGrupo}</span>
              <table>
                <thead><tr><th>#</th><th>Time</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead>
                <tbody>
                  ${tabG.map((t, i) => `<tr><td>${i + 1}</td><td>${t.nome}</td><td>${t.pts}</td><td>${t.j}</td><td>${t.v}</td><td>${t.e}</td><td>${t.d}</td><td>${t.gp}</td><td>${t.gc}</td><td>${t.sg}</td></tr>`).join("")}
                </tbody>
              </table>
            </div>`;
        }
      } else {
        let tabU = [...data.times].sort(
          (a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp,
        );
        html += `
          <div class="card">
            <span class="fase-badge">${fase.nome}</span>
            <table>
              <thead><tr><th>#</th><th>Time</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Forma</th></tr></thead>
              <tbody>
                ${tabU
                  .map((t, i) => {
                    let forma = obterForma(t.id)
                      .map((r) => `<span class="bol ${r}">${r}</span>`)
                      .join("");
                    return `<tr><td>${i + 1}</td><td>${t.nome}</td><td>${t.pts}</td><td>${t.j}</td><td>${t.v}</td><td>${t.e}</td><td>${t.d}</td><td>${t.gp}</td><td>${t.gc}</td><td>${t.sg}</td><td><div class="forma">${forma}</div></td></tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>`;
      }
    }
  });

  container.innerHTML = html;
}

function renderRodadasAba() {
  let container = document.getElementById("listaRodadas");
  if (!container) return;

  if (!data.campeonato.fases.length) {
    container.innerHTML = `<p style="color:var(--muted)">Clique acima em "Iniciar Torneio" para gerar as partidas.</p>`;
    return;
  }

  let html = "";
  data.campeonato.fases.forEach((fase, fIdx) => {
    html += `<div style="margin-bottom:24px"><span class="fase-badge">${fase.nome}</span>`;

    if (fase.tipo === "PONTOS_CORRIDOS") {
      fase.rodadas.forEach((rd, rIdx) => {
        html += `
          <div class="rodada">
            <h3>${rd.grupo ? rd.grupo + " - " : ""}Rodada ${rd.numero}</h3>
            ${rd.jogos
              .map((j, jIdx) => {
                let c = data.times.find((x) => String(x.id) === String(j.casa));
                let f = data.times.find((x) => String(x.id) === String(j.fora));
                if (!c || !f) return "";
                return `<div class="jogo-info">
                <span>${c.nome}</span>
                <span class="placar">${j.golsCasa === null ? "— x —" : j.golsCasa + " x " + j.golsFora}</span>
                <span>${f.nome}</span>
                <button onclick="definirJogoPontosCorridos(${fIdx}, ${rIdx}, ${jIdx})">${j.golsCasa === null ? "Definir" : "Editar"}</button>
              </div>`;
              })
              .join("")}
          </div>`;
      });

      if (fase.grupos && !fase.concluida) {
        html += `<button class="gold" style="width:100%;padding:14px;margin-top:10px" onclick="promoverGruposParaMataMata()">🚀 Promover Classificados dos Grupos para o Mata-Mata</button>`;
      }
    } else if (fase.tipo === "MATA_MATA") {
      fase.etapas.forEach((etapa, eIdx) => {
        html += `
          <div class="rodada" style="border-left: 4px solid var(--primary)">
            <h3 style="color:var(--primary)">🔥 ${etapa.nome}</h3>
            ${etapa.jogos
              .map((j, jIdx) => {
                let c = data.times.find((x) => String(x.id) === String(j.casa));
                let f = data.times.find((x) => String(x.id) === String(j.fora));
                let nomeC = c ? c.nome : j.casaPlaceholder || "A definir";
                let nomeF = f ? f.nome : j.foraPlaceholder || "A definir";

                return `<div class="jogo-info">
                <span style="${j.vencedor === j.casa ? "color:var(--primary);font-weight:bold" : ""}">${nomeC}</span>
                <span class="placar">${j.golsCasa === null ? "— x —" : j.golsCasa + " x " + j.golsFora}</span>
                <span style="${j.vencedor === j.fora ? "color:var(--primary);font-weight:bold" : ""}">${nomeF}</span>
                <button onclick="definirJogoMataMata(${fIdx}, ${eIdx}, ${jIdx})">${j.golsCasa === null ? "Definir" : "Editar"}</button>
              </div>`;
              })
              .join("")}
          </div>`;
      });
    }

    html += `</div>`;
  });

  container.innerHTML = html;
}

render();
