const generateBtn = document.getElementById('generateBtn');
const computeBtn = document.getElementById('computeBtn');
const matrixInputs = document.getElementById('matrixInputs');
const vectorInputs = document.getElementById('vectorInputs');
const resultContainer = document.getElementById('result');
const messageContainer = document.getElementById('message');

// Función para mapear índices a nombres de variables (x, y, z, etc.)
function getVar(i) {
    const vars = ['x', 'y', 'z', 'w', 'u', 'v'];
    return vars[i] || `x_{${i + 1}}`;
}

// NUEVA FUNCIÓN: Genera la cadena de texto en formato LaTeX para la ecuación
function generateLatexEquation(A, n) {
    let terminos = [];
    
    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            let valor = A[i][j];
            if (Math.abs(valor) < 1e-9) continue;

            // Si es i != j, en una forma cuadrática sumamos a_ij + a_ji, o sea 2*a_ij
            let coeficiente = (i === j) ? valor : 2 * valor;
            let variablePart = (i === j) ? `${getVar(i)}^2` : `${getVar(i)}${getVar(j)}`;

            let signo = "";
            if (terminos.length > 0) {
                signo = coeficiente > 0 ? " + " : " - ";
            } else if (coeficiente < 0) {
                signo = "-";
            }

            let valorAbs = Math.abs(coeficiente);
            // No mostrar el "1" si acompaña a una variable, a menos que sea el único valor
            let coefTexto = (valorAbs === 1) ? "" : valorAbs.toFixed(2).replace(/\.00$/, "");

            terminos.push(`${signo}${coefTexto}${variablePart}`);
        }
    }

    const varsHeader = Array.from({length: n}, (_, i) => getVar(i)).join(',');
    return terminos.length > 0 
        ? `Q(${varsHeader}) = ${terminos.join("")}` 
        : `Q(${varsHeader}) = 0`;
}

function buildGrid(n) {
    matrixInputs.innerHTML = '<h3>Matriz A (n x n, simétrica)</h3>';
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('td');
            cell.style.padding = '4px';
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.style.width = '68px';
            input.id = `a_${i}_${j}`;
            input.value = (i === j ? '1' : '0');
            
            // Ayuda al usuario: si cambia a[i][j], cambia a[j][i] automáticamente
            input.oninput = () => {
                const mirror = document.getElementById(`a_${j}_${i}`);
                if (mirror) mirror.value = input.value;
            };

            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    matrixInputs.appendChild(table);

    vectorInputs.innerHTML = '<h3>Vector x (Punto de evaluación)</h3>';
    const vectorDiv = document.createElement('div');
    for (let i = 0; i < n; i++) {
        const vx = document.createElement('input');
        vx.type = 'number';
        vx.step = 'any';
        vx.style.width = '80px';
        vx.id = `x_${i}`;
        vx.value = '1';
        vx.style.marginRight = '6px';
        vectorDiv.appendChild(vx);
    }
    vectorInputs.appendChild(vectorDiv);
}

function readMatrix(n) {
    const A = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const el = document.getElementById(`a_${i}_${j}`);
            const val = parseFloat(el.value);
            A[i][j] = Number.isNaN(val) ? 0 : val;
        }
    }
    return A;
}

function readVector(n) {
    const x = Array(n);
    for (let i = 0; i < n; i++) {
        const el = document.getElementById(`x_${i}`);
        const val = parseFloat(el.value);
        x[i] = Number.isNaN(val) ? 0 : val;
    }
    return x;
}

function isSymmetric(A, eps = 1e-9) {
    const n = A.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(A[i][j] - A[j][i]) > eps) return false;
        }
    }
    return true;
}

function symmetrize(A) {
    const n = A.length;
    const B = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            B[i][j] = (A[i][j] + A[j][i]) / 2;
        }
    }
    return B;
}

function computeQ(A, x) {
    const n = x.length;
    const Ax = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            Ax[i] += A[i][j] * x[j];
        }
    }
    let q = 0;
    for (let i = 0; i < n; i++) {
        q += x[i] * Ax[i];
    }
    return q;
}

function classify(A) {
    let pos = 0;
    let neg = 0;
    const n = A.length;
    // Aumentamos un poco las muestras para mejor precisión
    for (let t = 0; t < 100; t++) {
        const x = Array.from({ length: n }, () => (Math.random() * 4 - 2));
        const q = computeQ(A, x);
        if (q > 1e-7) pos++;
        else if (q < -1e-7) neg++;
    }
    if (pos > 0 && neg > 0) return 'Indefinida';
    if (pos > 0 && neg === 0) return 'Definida o
                                
