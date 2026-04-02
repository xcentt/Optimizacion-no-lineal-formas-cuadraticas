const generateBtn = document.getElementById('generateBtn');
const computeBtn = document.getElementById('computeBtn');
const matrixInputs = document.getElementById('matrixInputs');
const vectorInputs = document.getElementById('vectorInputs');
const resultContainer = document.getElementById('result');
const messageContainer = document.getElementById('message');

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
            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    matrixInputs.appendChild(table);

    vectorInputs.innerHTML = '<h3>Vector x</h3>';
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
    let cero = 0;
    const n = A.length;
    for (let t = 0; t < 30; t++) {
        const x = Array.from({ length: n }, () => (Math.random() * 4 - 2));
        const q = computeQ(A, x);
        if (q > 1e-6) pos++;
        else if (q < -1e-6) neg++;
        else cero++;
    }
    if (pos > 0 && neg > 0) return 'Indefinida';
    if (pos > 0 && neg === 0) return 'Semidefinida positiva o definida positiva';
    if (neg > 0 && pos === 0) return 'Semidefinida negativa o definida negativa';
    return 'Casi nula (posible semidefinida)';
}

generateBtn.addEventListener('click', () => {
    const n = parseInt(document.getElementById('matrixSize').value, 10);
    if (Number.isNaN(n) || n < 2 || n > 6) {
        messageContainer.textContent = 'Ingrese un tamaño válido entre 2 y 6.';
        return;
    }
    messageContainer.textContent = '';
    buildGrid(n);
    resultContainer.textContent = '';
});

computeBtn.addEventListener('click', () => {
    const n = parseInt(document.getElementById('matrixSize').value, 10);
    if (Number.isNaN(n) || n < 2 || n > 6) {
        messageContainer.textContent = 'Ingrese un tamaño válido entre 2 y 6.';
        return;
    }

    let A = readMatrix(n);
    const x = readVector(n);

    if (!isSymmetric(A)) {
        messageContainer.textContent = 'Matriz A no es simétrica. Se usará la versión simétrica (A+Aᵀ)/2 para el cálculo.';
        A = symmetrize(A);
    } else {
        messageContainer.textContent = '';
    }

    const q = computeQ(A, x);
    const tipo = classify(A);

    resultContainer.innerHTML = `Q(x) = <strong>${q.toFixed(6)}</strong> <br>Clasificación (aprox.): <strong>${tipo}</strong>`;
});

// inicializa una vez
buildGrid(2);
