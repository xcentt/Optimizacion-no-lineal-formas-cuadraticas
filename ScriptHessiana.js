const exprInput = document.getElementById('expr');
const pointXInput = document.getElementById('pointX');
const pointYInput = document.getElementById('pointY');
const lambdaInput = document.getElementById('lambda');
const stepsContainer = document.getElementById('steps');
const messageContainer = document.getElementById('message');
const computeBtn = document.getElementById('computeBtn');

function safeExpression(expr) {
    const cleaned = expr.replace(/\^/g, '**');
    if (!/^[\d\s+\-*/().xyXY]+$/.test(cleaned)) {
        return null;
    }
    return cleaned;
}

function buildFunction(expr) {
    const safeExpr = safeExpression(expr);
    if (!safeExpr) return null;
    try {
        return new Function('x', 'y', `return ${safeExpr};`);
    } catch (error) {
        return null;
    }
}

function evaluateFunction(f, x, y) {
    try {
        const value = f(x, y);
        return Number.isFinite(value) ? value : NaN;
    } catch (error) {
        return NaN;
    }
}

function derivativePartial(f, x, y, variable) {
    const h = 1e-4;
    if (variable === 'x') {
        return (evaluateFunction(f, x + h, y) - evaluateFunction(f, x - h, y)) / (2 * h);
    }
    return (evaluateFunction(f, x, y + h) - evaluateFunction(f, x, y - h)) / (2 * h);
}

function secondPartial(f, x, y, type) {
    const h = 1e-4;
    if (type === 'xx') {
        return (evaluateFunction(f, x + h, y) - 2 * evaluateFunction(f, x, y) + evaluateFunction(f, x - h, y)) / (h * h);
    }
    if (type === 'yy') {
        return (evaluateFunction(f, x, y + h) - 2 * evaluateFunction(f, x, y) + evaluateFunction(f, x, y - h)) / (h * h);
    }
    return (evaluateFunction(f, x + h, y + h) - evaluateFunction(f, x + h, y - h) - evaluateFunction(f, x - h, y + h) + evaluateFunction(f, x - h, y - h)) / (4 * h * h);
}

function formatNumber(value) {
    if (!Number.isFinite(value)) return 'No válido';
    return value.toFixed(6);
}

function solveLinear2x2(a, b, c, d, e, f) {
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-12) return null;
    return [(e * d - b * f) / det, (a * f - e * c) / det];
}

function gradientAt(f, x, y) {
    return {
        gx: derivativePartial(f, x, y, 'x'),
        gy: derivativePartial(f, x, y, 'y'),
    };
}

function findCriticalPoint(f, x0 = 0, y0 = 0, maxIter = 15) {
    const steps = [];
    let x = x0;
    let y = y0;

    steps.push('<p><strong>Inicio de búsqueda de punto crítico</strong></p>');
    steps.push(`<p>Punto inicial: (${formatNumber(x)}, ${formatNumber(y)})</p>`);

    for (let i = 0; i < maxIter; i++) {
        const gx = derivativePartial(f, x, y, 'x');
        const gy = derivativePartial(f, x, y, 'y');
        const fxx = secondPartial(f, x, y, 'xx');
        const fyy = secondPartial(f, x, y, 'yy');
        const fxy = secondPartial(f, x, y, 'xy');

        steps.push(`<p><strong>Iteración ${i + 1}</strong></p>`);
        steps.push(`<pre>Gradiente ∇f = (f_x, f_y) = (${formatNumber(gx)}, ${formatNumber(gy)})</pre>`);
        steps.push(`<pre>Hessiana H = [[${formatNumber(fxx)}, ${formatNumber(fxy)}], [${formatNumber(fxy)}, ${formatNumber(fyy)}]]</pre>`);

        if (Math.hypot(gx, gy) < 1e-6) {
            steps.push('<p>El gradiente es cercano a cero, se encontró un punto crítico.</p>');
            return {x, y, steps, success: true};
        }

        const delta = solveLinear2x2(fxx, fxy, fxy, fyy, -gx, -gy);
        if (!delta) {
            steps.push('<p>La Hessiana es degenerada y el método de Newton no puede avanzar.</p>');
            return {x, y, steps, success: false, reason: 'Hessiana degenerada'};
        }

        const [dx, dy] = delta;
        steps.push(`<pre>Resolvemos H · Δ = -∇f → Δ = (${formatNumber(dx)}, ${formatNumber(dy)})</pre>`);
        x += dx;
        y += dy;
        steps.push(`<pre>Nuevo punto: (${formatNumber(x)}, ${formatNumber(y)})</pre>`);

        if (Math.hypot(dx, dy) < 1e-8) {
            steps.push('<p>El cambio en el punto es muy pequeño, se considera convergencia.</p>');
            return {x, y, steps, success: true};
        }
    }

    steps.push('<p>No se encontró un punto crítico con el método de Newton en el número máximo de iteraciones.</p>');
    return {x, y, steps, success: false, reason: 'No convergió'};
}

function eigenvalues2x2(a, b, c, d) {
    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;
    if (discriminant < 0) {
        const real = trace / 2;
        const imag = Math.sqrt(-discriminant) / 2;
        return [`${real.toFixed(6)} + ${imag.toFixed(6)}i`, `${real.toFixed(6)} - ${imag.toFixed(6)}i`, det, trace];
    }
    const sqrtDisc = Math.sqrt(discriminant);
    const lambda1 = (trace + sqrtDisc) / 2;
    const lambda2 = (trace - sqrtDisc) / 2;
    return [lambda1, lambda2, det, trace];
}

function classifyHessian(a, b, c, d) {
    const [lambda1, lambda2, det] = eigenvalues2x2(a, b, c, d);
    const parsed1 = typeof lambda1 === 'number' ? lambda1 : NaN;
    const parsed2 = typeof lambda2 === 'number' ? lambda2 : NaN;
    const eps = 1e-8;

    if (Number.isFinite(parsed1) && Number.isFinite(parsed2)) {
        if (det > eps && parsed1 > 0 && parsed2 > 0) {
            return 'Mínimo local (matriz positiva definida, función convexa en el entorno)';
        }
        if (det > eps && parsed1 < 0 && parsed2 < 0) {
            return 'Máximo local (matriz negativa definida, función cóncava en el entorno)';
        }
        if (det < -eps) {
            return 'Punto silla (matriz indefinida, ni cóncava ni convexa)';
        }
        return 'Caso degenerado o inconcluso (determinante cercano a cero o algún autovalor nulo)';
    }
    return 'Eigenvalores complejos: la clasificación estándar en ℝ no es aplicable';
}

function buildMatrixHtml(matrix) {
    return `[[${formatNumber(matrix[0][0])}, ${formatNumber(matrix[0][1])}], [${formatNumber(matrix[1][0])}, ${formatNumber(matrix[1][1])}]]`;
}

function renderSteps(content) {
    stepsContainer.innerHTML = content;
}

computeBtn.addEventListener('click', () => {
    const expression = exprInput.value.trim();
    const f = buildFunction(expression);
    const rawX = pointXInput.value.trim();
    const rawY = pointYInput.value.trim();
    const x = parseFloat(rawX);
    const y = parseFloat(rawY);
    const lambda = parseFloat(lambdaInput.value);
    messageContainer.textContent = '';

    if (!expression) {
        messageContainer.textContent = 'Ingresa una función válida de f(x, y).';
        renderSteps('');
        return;
    }
    if (!f) {
        messageContainer.textContent = 'La función contiene caracteres no permitidos o sintaxis inválida. Usa solo x, y, números y operadores + - * / ^.';
        renderSteps('');
        return;
    }
    if (!Number.isFinite(lambda)) {
        messageContainer.textContent = 'Asegúrate de que λ sea un valor numérico.';
        renderSteps('');
        return;
    }

    let criticalPoint = {x, y};
    let criticalStepHtml = '';
    const hasProvidedPoint = Number.isFinite(x) && Number.isFinite(y);

    if (hasProvidedPoint) {
        const gradient = gradientAt(f, x, y);
        const gradNorm = Math.hypot(gradient.gx, gradient.gy);
        criticalStepHtml = `
            <div class="result-block">
                <p><strong>Punto crítico proporcionado:</strong> (${formatNumber(x)}, ${formatNumber(y)})</p>
                <p><strong>Gradiente en ese punto:</strong> ∇f = (${formatNumber(gradient.gx)}, ${formatNumber(gradient.gy)})</p>
                <p>${gradNorm < 1e-4 ? 'Este punto se aproxima a un punto crítico porque el gradiente es cercano a cero.' : 'Este punto no es estrictamente crítico porque el gradiente no es cero. Se evaluará de todas formas para mostrar el proceso.'}</p>
            </div>
        `;
    } else {
        const solver = findCriticalPoint(f, 0, 0);
        if (!solver.success) {
            messageContainer.textContent = 'No se pudo encontrar un punto crítico automáticamente: ' + solver.reason;
            renderSteps(`<div class="result-block">${solver.steps.join('')}</div>`);
            return;
        }
        criticalPoint = {x: solver.x, y: solver.y};
        criticalStepHtml = `<div class="result-block">${solver.steps.join('')}</div>`;
    }

    const fx = derivativePartial(f, criticalPoint.x, criticalPoint.y, 'x');
    const fy = derivativePartial(f, criticalPoint.x, criticalPoint.y, 'y');
    const fxx = secondPartial(f, criticalPoint.x, criticalPoint.y, 'xx');
    const fyy = secondPartial(f, criticalPoint.x, criticalPoint.y, 'yy');
    const fxy = secondPartial(f, criticalPoint.x, criticalPoint.y, 'xy');

    const hessian = [
        [fxx, fxy],
        [fxy, fyy],
    ];
    const scaledHessian = [
        [lambda * fxx, lambda * fxy],
        [lambda * fxy, lambda * fyy],
    ];

    const [eig1, eig2, detH, traceH] = eigenvalues2x2(fxx, fxy, fxy, fyy);
    const classification = classifyHessian(fxx, fxy, fxy, fyy);
    const concavity = classification.includes('Mínimo local')
        ? 'Convexo cerca del punto'
        : classification.includes('Máximo local')
            ? 'Cóncavo cerca del punto'
            : classification.includes('Punto silla')
                ? 'Ni cóncavo ni convexo'
                : 'Inconcluso o degenerado';

    const content = `
        <h2>Resultados</h2>
        ${criticalStepHtml}
        <div class="result-block">
            <p><strong>Función ingresada:</strong> f(x, y) = ${expression}</p>
            <p><strong>Punto crítico usado:</strong> (w, d) = (${formatNumber(criticalPoint.x)}, ${formatNumber(criticalPoint.y)})</p>
            <p><strong>Multiplicación por λ:</strong> λ = ${lambda}</p>
            <hr>
            <p><strong>Derivadas parciales primeras en el punto crítico:</strong></p>
            <pre>f_x = ${formatNumber(fx)}
f_y = ${formatNumber(fy)}</pre>
            <p><strong>Segundas derivadas y Hessiana:</strong></p>
            <pre>f_{xx} = ${formatNumber(fxx)}
f_{yy} = ${formatNumber(fyy)}
f_{xy} = f_{yx} = ${formatNumber(fxy)}</pre>
            <p><strong>Matriz Hessiana H(w, d):</strong></p>
            <pre>${buildMatrixHtml(hessian)}</pre>
            <p><strong>Hessiana multiplicada por λ:</strong></p>
            <pre>${buildMatrixHtml(scaledHessian)}</pre>
            <p><strong>Autovalores de H:</strong></p>
            <pre>λ₁ = ${typeof eig1 === 'number' ? formatNumber(eig1) : eig1}
λ₂ = ${typeof eig2 === 'number' ? formatNumber(eig2) : eig2}</pre>
            <p><strong>Traza:</strong> ${formatNumber(traceH)}  <strong>Determinante:</strong> ${formatNumber(detH)}</p>
            <p><strong>Clasificación del punto crítico:</strong></p>
            <pre>${classification}</pre>
            <p><strong>Concavidad / convexidad local:</strong></p>
            <pre>${concavity}</pre>
        </div>
    `;

    renderSteps(content);
});
