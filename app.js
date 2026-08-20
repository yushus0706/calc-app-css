const expressionEl = document.querySelector('#expression');
const resultEl = document.querySelector('#result');
const historyList = document.querySelector('#historyList');
const statusText = document.querySelector('#statusText');
let expression = '';
let lastAnswer = 0;
let angleMode = 'DEG';
let memory = 0;

const functions = { sin: Math.sin, cos: Math.cos, tan: Math.tan, ln: Math.log, log: Math.log10, sqrt: Math.sqrt, cbrt: Math.cbrt };
function factorial(value) { if (value < 0 || !Number.isInteger(value) || value > 170) throw Error('Factorial needs a whole number'); let total = 1; for (let i = 2; i <= value; i++) total *= i; return total; }
function tokenize(input) {
  const tokens = []; let index = 0;
  while (index < input.length) { const rest = input.slice(index); const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i); const name = rest.match(/^[a-z]+/i);
    if (number) { tokens.push({ type: 'number', value: Number(number[0]) }); index += number[0].length; }
    else if (name) { tokens.push({ type: 'name', value: name[0].toLowerCase() }); index += name[0].length; }
    else if ('π'.includes(input[index])) { tokens.push({ type: 'number', value: Math.PI }); index++; }
    else if ('+-−×÷*/^!%()'.includes(input[index])) { tokens.push({ type: input[index] === '(' || input[index] === ')' ? input[index] : 'op', value: input[index] }); index++; }
    else if (/\s/.test(input[index])) index++; else throw Error(`Unknown character “${input[index]}”`);
  } return tokens;
}
function evaluate(input) {
  const tokens = tokenize(input.replace(/\bANS\b/gi, String(lastAnswer).replace('e+', 'e'))); let position = 0;
  const peek = () => tokens[position]; const take = () => tokens[position++];
  const startsValue = token => token && (token.type === 'number' || token.type === 'name' || token.type === '(');
  function primary() { const token = take(); if (!token) throw Error('Incomplete expression'); if (token.type === 'number') return token.value;
    if (token.type === 'name') { if (token.value === 'e') return Math.E; if (!functions[token.value]) throw Error(`Unknown function ${token.value}`); if (!peek() || peek().type !== '(') throw Error('Function needs parentheses'); take(); const value = additive(); if (!peek() || take().type !== ')') throw Error('Missing closing parenthesis'); return token.value === 'sin' || token.value === 'cos' || token.value === 'tan' ? functions[token.value](angleMode === 'DEG' ? value * Math.PI / 180 : value) : functions[token.value](value); }
    if (token.type === '(') { const value = additive(); if (!peek() || take().type !== ')') throw Error('Missing closing parenthesis'); return value; } throw Error('Expected a value'); }
  function postfix() { let value = primary(); while (peek()?.value === '!' || peek()?.value === '%') { const operator = take().value; value = operator === '!' ? factorial(value) : value / 100; } return value; }
  function power() { let value = postfix(); if (peek()?.value === '^') { take(); value = value ** power(); } return value; }
  function unary() { if (peek()?.value === '+' || peek()?.value === '−' || peek()?.value === '-') { const sign = take().value; return (sign === '−' || sign === '-') ? -unary() : unary(); } return power(); }
  function multiplicative() { let value = unary(); while (peek() && (['×', '÷', '*', '/'].includes(peek().value) || startsValue(peek()))) { if (startsValue(peek())) value *= unary(); else { const operator = take().value; const right = unary(); if (operator === '÷' || operator === '/') { if (right === 0) throw Error('Cannot divide by zero'); value /= right; } else value *= right; } } return value; }
  function additive() { let value = multiplicative(); while (peek() && ['+', '−', '-'].includes(peek().value)) { const operator = take().value; const right = multiplicative(); value = operator === '+' ? value + right : value - right; } return value; }
  const value = additive(); if (position < tokens.length) throw Error('Check your expression'); if (!Number.isFinite(value)) throw Error('Result is not finite'); return value;
}
function format(value) { return Number(value.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 12, useGrouping: false }); }
function render() { expressionEl.textContent = expression || '0'; if (!expression) resultEl.textContent = '0'; }
function setExpression(value) { expression = value; render(); try { resultEl.textContent = format(evaluate(expression)); resultEl.classList.remove('error'); } catch { resultEl.textContent = expression ? '…' : '0'; resultEl.classList.remove('error'); } }
function calculate() { if (!expression) return; try { const value = evaluate(expression); lastAnswer = value; memory = value; document.querySelector('#memoryLabel').textContent = `MEM · ${format(memory)}`; resultEl.textContent = format(value); resultEl.classList.remove('error'); statusText.textContent = 'Calculation complete'; addHistory(expression, format(value)); } catch (error) { resultEl.textContent = error.message; resultEl.classList.add('error'); statusText.textContent = 'Review expression'; } }
function addHistory(input, output) { const empty = historyList.querySelector('.empty-history'); if (empty) empty.remove(); const item = document.createElement('div'); item.className = 'history-item'; item.innerHTML = `<div class="history-expression">${input}</div><div class="history-result">= ${output}</div>`; item.addEventListener('click', () => setExpression(input)); historyList.prepend(item); }
document.querySelectorAll('.key').forEach(button => button.addEventListener('click', () => { const action = button.dataset.action; if (action === 'clear') { expression = ''; resultEl.classList.remove('error'); statusText.textContent = 'Ready to calculate'; render(); } else if (action === 'backspace') setExpression(expression.slice(0, -1)); else if (action === 'ans') setExpression(expression + 'ANS'); else if (action === 'equals') calculate(); else setExpression(expression + button.dataset.value); }));
document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => { angleMode = button.dataset.mode; document.querySelectorAll('.mode').forEach(mode => mode.classList.toggle('active', mode === button)); if (expression) setExpression(expression); }));
document.querySelector('#clearHistory').addEventListener('click', () => { historyList.innerHTML = '<div class="empty-history"><span>⌁</span><p>Your recent calculations<br>will appear here.</p></div>'; });
document.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); } else if (event.key === 'Backspace') setExpression(expression.slice(0, -1)); else if (event.key === 'Escape') { expression = ''; render(); } else if (/^[0-9.+\-*/^()%!]$/.test(event.key)) setExpression(expression + event.key.replace('*', '×').replace('/', '÷')); });