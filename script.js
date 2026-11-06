// Informacoes que mudam durante a visita.
const estadoMuseu = {
  total: 3,
  visitados: new Set(),
  portaAberta: false
};

// Altera a mensagem e o contador dentro da cena.
function atualizarPainel(mensagem) {
  const textoInfo = document.querySelector("#textoInfo");
  const placar = document.querySelector("#placar");

  textoInfo.setAttribute("value", mensagem);

  const quantidade = estadoMuseu.visitados.size;
  placar.setAttribute(
    "value",
    "Objetos visitados: " + quantidade +
    " de " + estadoMuseu.total
  );
}

AFRAME.registerComponent("objeto-exposicao", {
  schema: {
    mensagem: { type: "string" },
    cordestaque: { type: "color", default: "#FFD166" }
  },

  init: function () {
    const material = this.el.getAttribute("material");
    this.corOriginal = material && material.color
      ? material.color : "#FFFFFF";
    this.escalaOriginal = this.el.object3D.scale.clone();

    this.el.addEventListener("mouseenter", () => {
      this.el.object3D.scale
        .copy(this.escalaOriginal).multiplyScalar(1.08);
    });

    this.el.addEventListener("mouseleave", () => {
      this.el.object3D.scale.copy(this.escalaOriginal);
    });

    this.el.addEventListener("click", () => {
      estadoMuseu.visitados.add(this.el.id);
      atualizarPainel(this.data.mensagem);

      this.el.setAttribute(
        "material", "color", this.data.cordestaque
      );
      window.setTimeout(() => {
        this.el.setAttribute(
          "material", "color", this.corOriginal
        );
      }, 700);
      verificarConclusao();
    });
  },

  restaurar: function () {
    this.el.setAttribute("material", "color", this.corOriginal);
    this.el.object3D.scale.copy(this.escalaOriginal);
  }
});

function verificarConclusao() {
  if (
    estadoMuseu.visitados.size === estadoMuseu.total &&
    !estadoMuseu.portaAberta
  ) {
    estadoMuseu.portaAberta = true;

    const porta = document.querySelector("#porta");
    const textoPorta = document.querySelector("#textoPorta");

    porta.setAttribute(
      "animation__abrir",
      "property: position; to: 0 5 -7.7; dur: 1500; easing: easeOutQuad"
    );
    textoPorta.setAttribute("value", "PORTA LIBERADA!");
    textoPorta.setAttribute("color", "#20A66A");

    atualizarPainel(
      "Parabens! Voce visitou toda a exposicao e abriu a porta."
    );
  }
}

AFRAME.registerComponent("reiniciar-museu", {
  init: function () {
    this.el.addEventListener("click", () => {
      estadoMuseu.visitados.clear();
      estadoMuseu.portaAberta = false;

      document.querySelectorAll("[objeto-exposicao]")
        .forEach((objeto) => {
          const componente = objeto.components["objeto-exposicao"];
          if (componente) componente.restaurar();
        });

      const porta = document.querySelector("#porta");
      porta.removeAttribute("animation__abrir");
      porta.setAttribute("position", "0 1.6 -7.7");

      const textoPorta = document.querySelector("#textoPorta");
      textoPorta.setAttribute("value", "PORTA BLOQUEADA");
      textoPorta.setAttribute("color", "#17233C");

      atualizarPainel("Escolha uma das tres pecas da exposicao.");
    });
  }
});

AFRAME.registerComponent("movimento-quest", {
  schema: {
    velocidade: { type: "number", default: 2 }
  },

  init: function () {
    this.eixoX = 0;
    this.eixoY = 0;

    this.el.addEventListener("thumbstickmoved", (evento) => {
      this.eixoX = Math.abs(evento.detail.x) > 0.15
        ? evento.detail.x : 0;
      this.eixoY = Math.abs(evento.detail.y) > 0.15
        ? evento.detail.y : 0;
    });
  },

  tick: function (tempo, intervalo) {
    if (this.eixoX === 0 && this.eixoY === 0) return;

    const rig = document.querySelector("#rig");
    const cameraEl = document.querySelector("#camera");
    const camera3D = cameraEl.getObject3D("camera")
      || cameraEl.object3D;

    const frente = new THREE.Vector3();
    camera3D.getWorldDirection(frente);
    frente.y = 0;
    frente.normalize();
    const direita = new THREE.Vector3()
      .crossVectors(frente, new THREE.Vector3(0, 1, 0))
      .normalize();

    const distancia = this.data.velocidade * (intervalo / 1000);
    rig.object3D.position.addScaledVector(
      frente, -this.eixoY * distancia
    );
    rig.object3D.position.addScaledVector(
      direita, this.eixoX * distancia
    );

    // Mantem o visitante dentro do museu.
    rig.object3D.position.x = THREE.MathUtils.clamp(
      rig.object3D.position.x, -6.8, 6.8
    );
    rig.object3D.position.z = THREE.MathUtils.clamp(
      rig.object3D.position.z, -8.2, 7.2
    );
  }
});