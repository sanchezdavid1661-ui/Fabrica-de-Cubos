
// =================================
// CONTROLES DE NAVEGACIÓN
// =================================

// Buscar la cámara de A-Frame.
const camara = document.querySelector('[camera]');

// Buscar los cuatro botones.
const botones = document.querySelectorAll(
    '#controles-navegacion .tecla'
);

// Velocidad de desplazamiento.
const velocidad = 10;

// Guardar las direcciones presionadas.
const direccionesActivas = new Set();

// Tiempo de la última actualización.
let tiempoAnterior = 0;


// =================================
// PRESIONAR Y SOLTAR BOTONES
// =================================

botones.forEach(boton => {

    const direccion = boton.dataset.direccion;

    // Al presionar.
    boton.addEventListener('pointerdown', (evento) => {

        evento.preventDefault();

        direccionesActivas.add(direccion);

        boton.classList.add('presionada');

        boton.setPointerCapture(evento.pointerId);

    });

    // Al soltar.
    function soltarBoton(evento) {

        evento.preventDefault();

        direccionesActivas.delete(direccion);

        boton.classList.remove('presionada');

    }

    boton.addEventListener('pointerup', soltarBoton);

    boton.addEventListener('pointercancel', soltarBoton);

    boton.addEventListener('lostpointercapture', soltarBoton);

});


// =================================
// MOVIMIENTO DE LA CÁMARA
// =================================

function moverCamara(tiempoActual) {

    requestAnimationFrame(moverCamara);

    if (!camara || !camara.object3D) return;

    // Calcular el tiempo transcurrido.
    const delta = tiempoAnterior
        ? Math.min((tiempoActual - tiempoAnterior) / 1000, 0.05)
        : 0;

    tiempoAnterior = tiempoActual;

    // Obtener la orientación de la cámara.
    const rotacionY = camara.object3D.rotation.y;

    // Dirección hacia adelante.
    const adelanteX = -Math.sin(rotacionY);
    const adelanteZ = -Math.cos(rotacionY);

    // Dirección hacia la derecha.
    const derechaX = Math.cos(rotacionY);
    const derechaZ = -Math.sin(rotacionY);

    // Desplazamiento acumulado.
    let movimientoX = 0;
    let movimientoZ = 0;

    // Avanzar.
    if (direccionesActivas.has('adelante')) {
        movimientoX += adelanteX;
        movimientoZ += adelanteZ;
    }

    // Retroceder.
    if (direccionesActivas.has('atras')) {
        movimientoX -= adelanteX;
        movimientoZ -= adelanteZ;
    }

    // Desplazarse a la izquierda.
    if (direccionesActivas.has('izquierda')) {
        movimientoX -= derechaX;
        movimientoZ -= derechaZ;
    }

    // Desplazarse a la derecha.
    if (direccionesActivas.has('derecha')) {
        movimientoX += derechaX;
        movimientoZ += derechaZ;
    }

    // Normalizar para evitar diagonales más rápidas.
    const longitud = Math.sqrt(
        movimientoX * movimientoX +
        movimientoZ * movimientoZ
    );

    if (longitud > 0) {

        movimientoX /= longitud;
        movimientoZ /= longitud;

        camara.object3D.position.x +=
            movimientoX * velocidad * delta;

        camara.object3D.position.z +=
            movimientoZ * velocidad * delta;

    }

}


// =================================
// LIBERAR BOTONES
// =================================

function liberarBotones() {

    direccionesActivas.clear();

    botones.forEach(boton => {
        boton.classList.remove('presionada');
    });

}

window.addEventListener('blur', liberarBotones);

document.addEventListener('visibilitychange', () => {

    if (document.hidden) {
        liberarBotones();
    }

});


// =================================
// INICIAR MOVIMIENTO
// =================================

requestAnimationFrame(moverCamara);