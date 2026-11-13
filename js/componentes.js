// Componentes JavaScript de la fábrica Mario Bros.

AFRAME.registerComponent('toggle-cinta', {
  init: function () {
    this.enMarcha = false;
    this.temporizador = null;
    this.totalCajas = 0;
    this.yaArrancoCinta = false;

    // Obtener los dos sonidos declarados en a-assets.
    this.sonidoPalanca = document.querySelector('#sonido-palanca');
    this.sonidoFabrica = document.querySelector('#sonido-fabrica');
    this.tiempoInicioFabrica = null;

    // El sonido de la fábrica se repite mientras la máquina está activa.
    if (this.sonidoFabrica) {
      this.sonidoFabrica.loop = true;
    }

    this.alternar = () => {
      const escena = this.el.sceneEl;
      const cinta = escena.querySelector('#conveyor-group');

      // Cada toque reproduce una sola vez el sonido de la palanca.
      if (this.sonidoPalanca) {
        this.sonidoPalanca.pause();
        this.sonidoPalanca.currentTime = 0;
        this.sonidoPalanca.play().catch(error => {
          console.warn('No se pudo reproducir el sonido de la palanca:', error);
        });
      }

      if (this.enMarcha) {
        // DETENER la fábrica y la cinta.
        this.enMarcha = false;
        clearInterval(this.temporizador);
        this.temporizador = null;

        // Cancelar el inicio pendiente del sonido de fábrica, si lo hubiera.
        clearTimeout(this.tiempoInicioFabrica);
        this.tiempoInicioFabrica = null;

        // Detener y reiniciar el sonido de fábrica para la próxima activación.
        if (this.sonidoFabrica) {
          this.sonidoFabrica.pause();
          this.sonidoFabrica.currentTime = 0;
        }

        if (cinta) {
          cinta.emit('cinta-frena');
        }

        // Pausar las cajas que siguen avanzando por la cinta.
        escena.querySelectorAll('.caja-en-cinta').forEach(caja => {
          caja.emit('cinta-frena');
        });
      } else {
        // ARRANCAR o REANUDAR la cinta.
        this.enMarcha = true;

        if (cinta) {
          cinta.emit(
            this.yaArrancoCinta ? 'cinta-reanuda' : 'cinta-arranca'
          );
          this.yaArrancoCinta = true;
        }

        // Reanudar las cajas que estaban pausadas.
        escena.querySelectorAll('.caja-en-cinta').forEach(caja => {
          caja.emit('cinta-reanuda');
        });

        this.crearCaja();

        this.temporizador = setInterval(() => {
          if (this.enMarcha) {
            this.crearCaja();
          }
        }, 1500);

        // Iniciar el sonido de fábrica después del movimiento de la palanca.
        this.tiempoInicioFabrica = setTimeout(() => {
          if (this.enMarcha && this.sonidoFabrica) {
            this.sonidoFabrica.currentTime = 0;
            this.sonidoFabrica.play().catch(error => {
              console.warn('No se pudo reproducir el sonido de la fábrica:', error);
            });
          }
        }, 300);
      }
    };

    // Registrar el clic de la palanca.
    this.el.addEventListener('click', this.alternar);
  },

  crearCaja: function () {
    if (!this.enMarcha) return;

    const escena = this.el.sceneEl;
    const lugar = this.totalCajas;
    const esCajaMoneda = lugar % 2 !== 0;
    this.totalCajas += 1;

    const caja = document.createElement('a-box');
    caja.id = 'caja-produccion-' + lugar;
    caja.classList.add('caja-produccion', 'caja-en-cinta');

    if (esCajaMoneda) {
      caja.classList.add('caja-moneda-interactiva', 'clic');
    }

    caja.setAttribute('width', '0.8');
    caja.setAttribute('height', '0.8');
    caja.setAttribute('depth', '0.8');
    caja.setAttribute('scale', '0.867 0.867 0.867');

    caja.setAttribute(
      'material',
      esCajaMoneda
        ? 'src: #caja-moneda; repeat: 1 1; emissive: #FFB800; emissiveIntensity: 0'
        : 'src: #tierra; repeat: 1 1'
    );

    if (esCajaMoneda) {
      caja.setAttribute(
        'sound',
        'src: #sonido-caja-moneda; on: click; volume: 0.8'
      );

      caja.setAttribute(
        'animation__salto',
        'property: object3D.position.y; from: 0.41; to: 0.72; dur: 180; dir: alternate; loop: 2; easing: easeOutQuad; startEvents: click'
      );

      caja.setAttribute(
        'animation__brillo',
        'property: material.emissiveIntensity; from: 0; to: 1; dur: 250; dir: alternate; loop: 2; easing: easeOutQuad; startEvents: click'
      );
    }

    // Elegir un destino diferente para esparcir las cajas sobre el pasto.
    const columna = lugar % 5;
    const fila = Math.floor(lugar / 5);

    const destinoX =
      6.4 + columna * 0.9 + (Math.random() - 0.5) * 0.14;

    const destinoZ =
      -7.3 + fila * 0.9 + (Math.random() - 0.5) * 0.14;

    const angulos = [0, 90, 180, 270];
    const rotX = angulos[Math.floor(Math.random() * angulos.length)];
    const rotY = angulos[Math.floor(Math.random() * angulos.length)];
    const rotZ = angulos[1 + Math.floor(Math.random() * 3)];

    // 1. Recorrido por la cinta transportadora.
    caja.setAttribute(
      'animation__avance',
      `property: position;
       from: -1.45 1.30 -5.60;
       to: 3.95 1.30 -5.60;
       dur: 4200;
       easing: linear;
       pauseEvents: cinta-frena;
       resumeEvents: cinta-reanuda`
    );

    // 2. Caída desde el extremo de la cinta.
    caja.setAttribute(
      'animation__caida',
      `property: position;
       to: 4.25 0.41 -5.60;
       dur: 550;
       easing: easeInQuad;
       startEvents: animationcomplete__avance`
    );

    // 3. Desplazamiento final y giro para simular que rueda por el pasto.
    caja.setAttribute(
      'animation__esparce',
      `property: position;
       to: ${destinoX} 0.41 ${destinoZ};
       dur: 1400;
       easing: easeOutQuad;
       startEvents: animationcomplete__caida`
    );

    caja.setAttribute(
      'animation__rueda',
      `property: rotation;
       from: 0 0 0;
       to: ${rotX} ${rotY} ${rotZ};
       dur: 1400;
       easing: easeOutQuad;
       startEvents: animationcomplete__caida`
    );

    caja.addEventListener('animationcomplete__caida', () => {
      caja.classList.remove('caja-en-cinta');
      caja.classList.add('caja-cayendo');
    }, { once: true });

    caja.addEventListener('animationcomplete__esparce', () => {
      caja.classList.remove('caja-cayendo');
      caja.classList.add('caja-esparcida');

      // Las cajas de moneda se pueden tocar cuando terminan de caer.
      if (esCajaMoneda) {
        caja.classList.add('clic');
      }
    }, { once: true });

    escena.appendChild(caja);
  },

  remove: function () {
    clearInterval(this.temporizador);
    this.el.removeEventListener('click', this.alternar);
  }
});

AFRAME.registerComponent('cinta-movimiento', {
  init: function () {
    this.enMarcha = false;
    this.segmentos = [];

    // Eventos para arrancar, reanudar y frenar la cinta.
    this.alArrancar = () => {
      this.enMarcha = true;
    };

    this.alReanudar = () => {
      this.enMarcha = true;
    };

    this.alFrenar = () => {
      this.enMarcha = false;
    };

    this.el.addEventListener('cinta-arranca', this.alArrancar);
    this.el.addEventListener('cinta-reanuda', this.alReanudar);
    this.el.addEventListener('cinta-frena', this.alFrenar);
  },

  tick: function (time, delta) {
    if (!this.enMarcha || !delta) return;

    // Cargar los segmentos móviles de la parte superior una sola vez.
    if (this.segmentos.length === 0) {
      this.segmentos = Array.from(
        this.el.querySelectorAll('.cinta-segmento')
      ).map(elemento => {
        const escala = elemento.object3D.scale;
        const ancho = parseFloat(elemento.getAttribute('width')) || 0.75;

        return {
          elemento: elemento,
          mitadAncho: ancho * Math.abs(escala.x) / 2,
          escalaOriginal: {
            x: escala.x,
            y: escala.y,
            z: escala.z
          },
          encogiendose: false
        };
      });
    }

    if (this.segmentos.length === 0) return;

    const velocidad = 0.8;
    const limiteDerecho = 3.114;
    const separacion = 0.03;
    const avance = velocidad * Math.min(delta, 50) / 1000;

    // Avanzar los segmentos y encogerlos al llegar al tope naranja.
    this.segmentos.forEach(segmento => {
      const elemento = segmento.elemento;
      const posicion = elemento.object3D.position;

      // No mover un segmento mientras se está encogiendo.
      if (segmento.encogiendose) return;

      posicion.x += avance;

      if (posicion.x + segmento.mitadAncho >= limiteDerecho) {
        segmento.encogiendose = true;

        // Al terminar de encogerse, recolocar y restaurar el segmento.
        elemento.addEventListener('animationcomplete__encoger', () => {
          let bordeIzquierdo = Infinity;

          this.segmentos.forEach(otro => {
            if (otro === segmento || otro.encogiendose) return;

            const borde =
              otro.elemento.object3D.position.x - otro.mitadAncho;

            if (borde < bordeIzquierdo) {
              bordeIzquierdo = borde;
            }
          });

          if (bordeIzquierdo !== Infinity) {
            posicion.x =
              bordeIzquierdo - segmento.mitadAncho - separacion;
          } else {
            posicion.x = -3.3;
          }

          elemento.removeAttribute('animation__encoger');
          elemento.setAttribute('scale', {
            x: segmento.escalaOriginal.x,
            y: segmento.escalaOriginal.y,
            z: segmento.escalaOriginal.z
          });

          segmento.encogiendose = false;
        }, { once: true });

        // Encoger únicamente en el eje X.
        elemento.setAttribute('animation__encoger', {
          property: 'scale',
          from: `${segmento.escalaOriginal.x} ${segmento.escalaOriginal.y} ${segmento.escalaOriginal.z}`,
          to: `0 ${segmento.escalaOriginal.y} ${segmento.escalaOriginal.z}`,
          dur: 350,
          easing: 'easeInQuad'
        });
      }
    });
  },

  remove: function () {
    // Limpiar los eventos al retirar el componente.
    this.el.removeEventListener('cinta-arranca', this.alArrancar);
    this.el.removeEventListener('cinta-reanuda', this.alReanudar);
    this.el.removeEventListener('cinta-frena', this.alFrenar);
  }
});