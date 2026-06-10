// --- AuraSenior Logic ---
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import {
  registrarUsuario,
  iniciarSesion,
  cerrarSesion,
  obtenerUsuarioActivo,
} from './db.js';

let currentSpeaking = null;

function playBubbleSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}

// Execute immediately, type="module" ensures DOM is ready
(() => {
    // ---- Tabs Navigation ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const contentSections = document.querySelectorAll('.content-section');
    const mascot = document.getElementById('mascot');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playBubbleSound();
            const tabId = btn.getAttribute('data-tab');
            
            if (mascot) {
                mascot.classList.add('jumping');
                setTimeout(() => {
                    mascot.classList.remove('jumping');
                }, 800);
            }
            
            tabBtns.forEach(b => b.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            const targetSection = document.getElementById(tabId);
            if (targetSection) targetSection.classList.add('active');
            
            stopSpeech();
        });
    });

    // ---- Text to Speech ----
    const voiceBtns = document.querySelectorAll('.voice-btn');
    
    voiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            const textElement = document.getElementById(`text-${section}`);
            if (!textElement) return;
            const text = textElement.textContent.trim();
            
            if (currentSpeaking && currentSpeaking === btn) {
                stopSpeech();
                return;
            }
            
            stopSpeech();
            speakText(text, btn);
        });
    });

    function speakText(text, btn) {
        if ('speechSynthesis' in window) {
            // Necesario para evitar que el garbage collector de Chrome cancele el habla
            window.speechSynthesis.cancel();
            
            setTimeout(() => {
                window.currentUtterance = new SpeechSynthesisUtterance(text);
                window.currentUtterance.lang = 'es-ES';
                window.currentUtterance.rate = 1.1;
                window.currentUtterance.pitch = 1.8;
                
                window.currentUtterance.onstart = () => {
                    currentSpeaking = btn;
                    btn.classList.add('speaking');
                    if (mascot) mascot.classList.add('speaking');
                };
                
                window.currentUtterance.onend = () => {
                    currentSpeaking = null;
                    btn.classList.remove('speaking');
                    if (mascot) mascot.classList.remove('speaking');
                };
                
                window.currentUtterance.onerror = () => {
                    currentSpeaking = null;
                    btn.classList.remove('speaking');
                    if (mascot) mascot.classList.remove('speaking');
                };
                
                window.speechSynthesis.speak(window.currentUtterance);
            }, 50);
        } else {
            alert('Tu navegador no soporta la síntesis de voz.');
        }
    }

    function stopSpeech() {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        if (currentSpeaking) {
            currentSpeaking.classList.remove('speaking');
            currentSpeaking = null;
        }
        if (mascot) mascot.classList.remove('speaking');
    }

    function celebrateGameCompletion(message) {
        if ('speechSynthesis' in window) {
            stopSpeech();
            setTimeout(() => {
                window.currentUtterance = new SpeechSynthesisUtterance(message);
                window.currentUtterance.lang = 'es-ES';
                window.currentUtterance.rate = 1.1;
                window.currentUtterance.pitch = 1.8;
                
                window.currentUtterance.onstart = () => {
                    if(mascot) mascot.classList.add('speaking');
                };
                
                window.currentUtterance.onend = () => {
                    if(mascot) mascot.classList.remove('speaking');
                };
                
                window.currentUtterance.onerror = () => {
                    if(mascot) mascot.classList.remove('speaking');
                };
                
                window.speechSynthesis.speak(window.currentUtterance);
            }, 50);
        }
    }

    // ---- Mascot Spikes Generation ----
    function generateSpikes() {
        const spikesContainer = document.getElementById('spikes');
        if (!spikesContainer) return;
        spikesContainer.innerHTML = '';
        const numSpikes = 40;
        const centerX = 70;
        const centerY = 70;
        const radius = 60;

        for (let i = 0; i < numSpikes; i++) {
            const angle = (i / numSpikes) * Math.PI * 2;
            const spike = document.createElement('div');
            spike.className = 'spike';
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            spike.style.left = `${x - 6}px`;
            spike.style.top = `${y - 25}px`;
            spike.style.transform = `rotate(${angle + Math.PI/2}rad)`;
            
            spikesContainer.appendChild(spike);
        }
    }
    generateSpikes();

    function generateSpikesForLanding() {
        const spikesContainer = document.getElementById('spikes-landing');
        if (!spikesContainer) return;
        spikesContainer.innerHTML = '';
        const numSpikes = 40;
        const centerX = 125;
        const centerY = 125;
        const radius = 105;

        for (let i = 0; i < numSpikes; i++) {
            const angle = (i / numSpikes) * Math.PI * 2;
            const spike = document.createElement('div');
            spike.style.position = 'absolute';
            spike.style.width = '0';
            spike.style.height = '0';
            spike.style.borderLeft = '10px solid transparent';
            spike.style.borderRight = '10px solid transparent';
            spike.style.borderBottom = '45px solid #000';
            spike.style.transformOrigin = 'center bottom';
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            spike.style.left = `${x - 10}px`;
            spike.style.top = `${y - 45}px`;
            spike.style.transform = `rotate(${angle + Math.PI/2}rad)`;
            
            spikesContainer.appendChild(spike);
        }
    }
    generateSpikesForLanding();

    function generateSpikesForLumi() {
        const spikesContainer = document.getElementById('spikes-lumi');
        if (!spikesContainer) return;
        spikesContainer.innerHTML = '';
        const numSpikes = 40;
        const centerX = 100;
        const centerY = 100;
        const radius = 85;

        for (let i = 0; i < numSpikes; i++) {
            const angle = (i / numSpikes) * Math.PI * 2;
            const spike = document.createElement('div');
            spike.style.position = 'absolute';
            spike.style.width = '0';
            spike.style.height = '0';
            spike.style.borderLeft = '8px solid transparent';
            spike.style.borderRight = '8px solid transparent';
            spike.style.borderBottom = '35px solid #000';
            spike.style.transformOrigin = 'center bottom';
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            spike.style.left = `${x - 8}px`;
            spike.style.top = `${y - 35}px`;
            spike.style.transform = `rotate(${angle + Math.PI/2}rad)`;
            
            spikesContainer.appendChild(spike);
        }
    }
    generateSpikesForLumi();

    // ---- Landing Page Transition ----
    const startBtn = document.getElementById('start-btn');
    const landingPage = document.getElementById('landing-page');
    const mainContainer = document.getElementById('main-container');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            landingPage.style.display = 'none';
            mainContainer.style.display = 'block';
            if (mascot) mascot.style.display = 'flex';
            playBubbleSound();
        });
    }

    // ---- Registration Form ----
    const ageInput = document.getElementById('edad');
    const decreaseBtn = document.getElementById('decrease-age');
    const increaseBtn = document.getElementById('increase-age');

    if (decreaseBtn && ageInput) {
        decreaseBtn.addEventListener('click', () => {
            let age = parseInt(ageInput.value);
            if (age > 18) {
                ageInput.value = age - 1;
            }
        });
    }

    if (increaseBtn && ageInput) {
        increaseBtn.addEventListener('click', () => {
            let age = parseInt(ageInput.value);
            if (age < 120) {
                ageInput.value = age + 1;
            }
        });
    }

    const genderBtns = document.querySelectorAll('.gender-btn');
    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    const registrationForm = document.getElementById('registration-form');
    const registrationSuccess = document.getElementById('registration-success');
    const btnResetRegistro = document.getElementById('btn-reset-registro');

    if (btnResetRegistro) {
        btnResetRegistro.addEventListener('click', () => {
            registrationSuccess.style.display = 'none';
            registrationForm.style.display = 'block';
            document.getElementById('nombre').value = '';
        });
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre').value;
            const edad = document.getElementById('edad').value;
            const generoBtn = document.querySelector('.gender-btn.selected');
            const genero = generoBtn ? generoBtn.getAttribute('data-gender') : '';
            
            if (!nombre || !genero) {
                alert('Por favor completa todos los campos.');
                return;
            }
            
            // Integración con DB
            // Pasamos también el género
            const nuevoUsuario = registrarUsuario(nombre, '', edad, genero);
            if (nuevoUsuario) {
                const regQrCodeContainer = document.getElementById('reg-qr-code');
                const regUserInfo = document.getElementById('reg-user-info');
                const btnDownloadQr = document.getElementById('btn-download-qr');
                
                regQrCodeContainer.innerHTML = '';
                regUserInfo.textContent = `${nuevoUsuario.nombre}`;

                QRCode.toDataURL(nuevoUsuario.id, {
                    width: 300,
                    margin: 4,
                    color: { dark: '#000000', light: '#FFFFFF' },
                    errorCorrectionLevel: 'H'
                }).then(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = `Código QR para ingresar de ${nuevoUsuario.nombre}`;
                    regQrCodeContainer.appendChild(img);

                    btnDownloadQr.onclick = () => {
                        const link = document.createElement('a');
                        link.download = `AuraSenior_QR_${nuevoUsuario.nombre}.png`;
                        link.href = url;
                        link.click();
                    };

                    registrationForm.style.display = 'none';
                    registrationSuccess.style.display = 'block';
                }).catch(err => {
                    console.error(err);
                    alert('Error al generar tu código QR, pero tu cuenta fue creada.');
                });
            }
        });
    }

    // ---- Word Search Logic ----
    const wordSearchToggle = document.getElementById('word-search-toggle');
    const wordSearchGame = document.getElementById('word-search-game');
    const wordListContainer = document.getElementById('word-list');
    const wordGridContainer = document.getElementById('word-grid');
    const resetGameBtn = document.getElementById('reset-game');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');

    const baseWords = ['FAMILIA', 'AMOR', 'ALEGRIA', 'SALUD', 'AMIGOS', 'NATURALEZA', 'MUSICA', 'RECUERDOS'];
    const levelWords = {
        easy: baseWords,
        medium: [...baseWords, 'VIDA', 'SONRISA', 'PAZ', 'ESPERANZA', 'CORAZON', 'LUZ'],
        hard: [...baseWords, 'VIDA', 'SONRISA', 'PAZ', 'ESPERANZA', 'CORAZON', 'LUZ', 'ABRAZO', 'FELICIDAD', 'SERENIDAD', 'ARMONIA', 'GRATITUD', 'VITALIDAD']
    };
    const difficultySettings = {
        easy: { gridSize: 10, directions: [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]], cellSize: 40 },
        medium: { gridSize: 12, directions: [[0, 1], [1, 0], [1, 1], [0, -1]], cellSize: 45 },
        hard: { gridSize: 14, directions: [[0, 1], [1, 0]], cellSize: 45 }
    };
    let currentDifficulty = 'easy';
    let gridSize = difficultySettings[currentDifficulty].gridSize;
    let grid = [];
    let selectedCells = [];
    let foundWords = [];

    if (wordSearchToggle && wordSearchGame) {
        wordSearchToggle.addEventListener('click', () => {
            if (wordSearchGame.style.display === 'none') {
                wordSearchGame.style.display = 'block';
                if (grid.length === 0) initWordSearchGame();
            } else {
                wordSearchGame.style.display = 'none';
            }
        });
    }

    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'var(--white)';
            });
            btn.classList.add('active');
            btn.style.background = 'linear-gradient(135deg, var(--blue-soft) 0%, var(--blue-pastel) 100%)';
            currentDifficulty = btn.getAttribute('data-level');
            gridSize = difficultySettings[currentDifficulty].gridSize;
            initWordSearchGame();
        });
    });

    if (resetGameBtn) resetGameBtn.addEventListener('click', initWordSearchGame);

    function initWordSearchGame() {
        if (!wordGridContainer) return;
        grid = [];
        selectedCells = [];
        foundWords = [];
        wordListContainer.innerHTML = '';
        wordGridContainer.innerHTML = '';
        const settings = difficultySettings[currentDifficulty];
        const currentWords = levelWords[currentDifficulty];

        for (let i = 0; i < settings.gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < settings.gridSize; j++) {
                grid[i][j] = '';
            }
        }

        currentWords.forEach(word => placeWord(word, settings));

        for (let i = 0; i < settings.gridSize; i++) {
            for (let j = 0; j < settings.gridSize; j++) {
                if (grid[i][j] === '') {
                    grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                }
            }
        }

        currentWords.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            wordItem.textContent = word;
            wordItem.id = `word-${word}`;
            wordItem.style.cursor = 'pointer';
            wordItem.addEventListener('click', () => {
                stopSpeech();
                speakText(word, wordItem);
            });
            wordListContainer.appendChild(wordItem);
        });

        wordGridContainer.style.gridTemplateColumns = `repeat(${settings.gridSize}, ${settings.cellSize}px)`;
        for (let i = 0; i < settings.gridSize; i++) {
            for (let j = 0; j < settings.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.style.width = `${settings.cellSize}px`;
                cell.style.height = `${settings.cellSize}px`;
                cell.style.fontSize = `${settings.cellSize * 0.5}px`;
                cell.textContent = grid[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => handleCellClick(i, j, cell));
                wordGridContainer.appendChild(cell);
            }
        }
    }

    function placeWord(word, settings) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 200) {
            const direction = settings.directions[Math.floor(Math.random() * settings.directions.length)];
            const startRow = Math.floor(Math.random() * settings.gridSize);
            const startCol = Math.floor(Math.random() * settings.gridSize);
            const endRow = startRow + (word.length - 1) * direction[0];
            const endCol = startCol + (word.length - 1) * direction[1];

            if (endRow >= 0 && endRow < settings.gridSize && endCol >= 0 && endCol < settings.gridSize) {
                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    const row = startRow + i * direction[0];
                    const col = startCol + i * direction[1];
                    if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    for (let i = 0; i < word.length; i++) {
                        const row = startRow + i * direction[0];
                        const col = startCol + i * direction[1];
                        grid[row][col] = word[i];
                    }
                    placed = true;
                }
            }
            attempts++;
        }
    }

    function handleCellClick(row, col, cell) {
        const index = selectedCells.findIndex(c => c.row === row && c.col === col);
        
        if (index !== -1) {
            for (let i = index; i < selectedCells.length; i++) {
                const oldCell = document.querySelector(`.grid-cell[data-row="${selectedCells[i].row}"][data-col="${selectedCells[i].col}"]`);
                if (oldCell) oldCell.classList.remove('selected');
            }
            selectedCells = selectedCells.slice(0, index);
        } else {
            if (selectedCells.length > 0) {
                const lastCell = selectedCells[selectedCells.length - 1];
                const rowDiff = Math.abs(row - lastCell.row);
                const colDiff = Math.abs(col - lastCell.col);
                if (rowDiff > 1 || colDiff > 1 || (rowDiff === 0 && colDiff === 0)) {
                    selectedCells.forEach(c => {
                        const oldCell = document.querySelector(`.grid-cell[data-row="${c.row}"][data-col="${c.col}"]`);
                        if (oldCell) oldCell.classList.remove('selected');
                    });
                    selectedCells = [];
                }
            }
            selectedCells.push({ row, col });
            cell.classList.add('selected');
            checkWord();
        }
    }

    function checkWord() {
        const currentWord = selectedCells.map(c => grid[c.row][c.col]).join('');
        const reversedWord = currentWord.split('').reverse().join('');
        const currentWords = levelWords[currentDifficulty];

        if (currentWords.includes(currentWord) && !foundWords.includes(currentWord)) {
            markWordFound(currentWord, selectedCells);
        } else if (currentWords.includes(reversedWord) && !foundWords.includes(reversedWord)) {
            markWordFound(reversedWord, selectedCells);
        }
    }

    function markWordFound(word, cells) {
        foundWords.push(word);
        cells.forEach(c => {
            const cell = document.querySelector(`.grid-cell[data-row="${c.row}"][data-col="${c.col}"]`);
            if (cell) {
                cell.classList.remove('selected');
                cell.classList.add('found');
            }
        });
        const wordItem = document.getElementById(`word-${word}`);
        if (wordItem) wordItem.classList.add('found');
        selectedCells = [];

        const currentWords = levelWords[currentDifficulty];
        if (foundWords.length === currentWords.length) {
            setTimeout(() => {
                alert('¡Felicidades! Has encontrado todas las palabras 🎉');
                celebrateGameCompletion('¡¡¡Felicidades!!! ¡Has completado la sopa de letras! ¡Excelente trabajo!');
            }, 300);
        }
    }


    // ---- Sudoku Logic ----
    const sudokuToggle = document.getElementById('sudoku-toggle');
    const sudokuGame = document.getElementById('sudoku-game');
    const sudokuGrid = document.getElementById('sudoku-grid');
    const sudokuCheck = document.getElementById('sudoku-check');
    const sudokuReset = document.getElementById('sudoku-reset');

    let sudokuSolution = [];
    let sudokuPuzzle = [];

    const sampleSudoku = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];
    const sampleSudokuSolution = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ];

    if (sudokuToggle && sudokuGame) {
        sudokuToggle.addEventListener('click', () => {
            if (sudokuGame.style.display === 'none') {
                sudokuGame.style.display = 'block';
                if (!sudokuGrid.children.length) initSudoku();
            } else {
                sudokuGame.style.display = 'none';
            }
        });
    }

    function initSudoku() {
        if (!sudokuGrid) return;
        sudokuPuzzle = sampleSudoku.map(row => [...row]);
        sudokuSolution = sampleSudokuSolution.map(row => [...row]);
        renderSudoku();
    }

    function renderSudoku() {
        sudokuGrid.innerHTML = '';
        for (let row = 0; row < 9; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'sudoku-row';
            rowDiv.style.display = 'flex';
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                if (sudokuPuzzle[row][col] !== 0) {
                    cell.className += ' fixed';
                    cell.textContent = sudokuPuzzle[row][col];
                } else {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.dataset.row = row;
                    input.dataset.col = col;
                    input.addEventListener('input', (e) => {
                        e.target.value = e.target.value.replace(/[^1-9]/g, '');
                    });
                    cell.appendChild(input);
                }
                rowDiv.appendChild(cell);
            }
            sudokuGrid.appendChild(rowDiv);
        }
    }

    if (sudokuCheck) {
        sudokuCheck.addEventListener('click', () => {
            let allCorrect = true;
            let allFilled = true;
            const inputs = sudokuGrid.querySelectorAll('input');
            inputs.forEach(input => {
                const row = parseInt(input.dataset.row);
                const col = parseInt(input.dataset.col);
                const cell = input.parentElement;
                cell.classList.remove('error', 'correct');
                
                if (input.value === '') {
                    allFilled = false;
                } else if (parseInt(input.value) === sudokuSolution[row][col]) {
                    cell.classList.add('correct');
                } else {
                    cell.classList.add('error');
                    allCorrect = false;
                }
            });
            if (allFilled && allCorrect) {
                setTimeout(() => {
                    alert('¡Felicidades! Sudoku resuelto 🎉');
                    celebrateGameCompletion('¡¡¡Felicidades!!! ¡Has resuelto el Sudoku! ¡Muy inteligente!');
                }, 100);
            }
        });
    }

    if (sudokuReset) sudokuReset.addEventListener('click', initSudoku);

    // ---- Crossword Logic ----
    const crosswordToggle = document.getElementById('crossword-toggle');
    const crosswordGame = document.getElementById('crossword-game');
    const crosswordGrid = document.getElementById('crossword-grid');
    const crosswordCheck = document.getElementById('crossword-check');
    const crosswordReset = document.getElementById('crossword-reset');
    const acrossClues = document.getElementById('across-clues');
    const downClues = document.getElementById('down-clues');
    const crosswordDifficultyBtns = document.querySelectorAll('.crossword-difficulty-btn');
    
    let currentCrosswordDifficulty = 'easy';

    const crosswordPuzzles = {
        easy: {
            size: 6, cellSize: 45,
            solution: [
                ['C', 'A', 'S', 'A', '', ''],
                ['', '', '', 'L', '', ''],
                ['P', 'E', 'R', 'R', 'O', ''],
                ['', '', '', 'E', '', ''],
                ['', '', '', 'N', '', ''],
                ['', '', '', 'A', '', '']
            ],
            clues: {
                across: [
                    { number: 1, text: '1. Edificio donde vive una familia (4 letras)', startRow: 0, startCol: 0 },
                    { number: 3, text: '3. Animal que ladra y es amigo del hombre (5 letras)', startRow: 2, startCol: 0 }
                ],
                down: [
                    { number: 2, text: '2. Fruta grande de color naranja o amarillo (5 letras)', startRow: 0, startCol: 3 }
                ]
            },
            blackCells: [ [0,4], [0,5], [1,0], [1,1], [1,2], [1,4], [1,5], [3,0], [3,1], [3,2], [3,4], [3,5], [4,0], [4,1], [4,2], [4,4], [4,5], [5,0], [5,1], [5,2], [5,4], [5,5] ]
        },
        medium: {
            size: 8, cellSize: 42,
            solution: [
                ['F', 'A', 'M', 'I', 'L', 'I', 'A', ''],
                ['', '', '', '', '', '', 'S', ''],
                ['', '', 'P', 'A', 'Z', '', 'O', ''],
                ['', '', '', '', '', '', 'L', ''],
                ['', '', '', '', '', '', 'U', ''],
                ['', '', '', '', '', '', 'D', ''],
                ['', '', '', '', '', '', 'A', ''],
                ['', '', '', '', '', '', '', '']
            ],
            clues: {
                across: [
                    { number: 1, text: '1. Padre, madre e hijos juntos (7 letras)', startRow: 0, startCol: 0 },
                    { number: 3, text: '3. Sin ruido ni preocupaciones (3 letras)', startRow: 2, startCol: 2 }
                ],
                down: [
                    { number: 2, text: '2. Astro que sale por la mañana y calienta (3 letras)', startRow: 0, startCol: 6 }
                ]
            },
            blackCells: [ [0,7], [1,0], [1,1], [1,2], [1,3], [1,4], [1,5], [1,7], [2,0], [2,1], [2,5], [2,7], [3,0], [3,1], [3,2], [3,3], [3,4], [3,5], [3,7], [4,0], [4,1], [4,2], [4,3], [4,4], [4,5], [4,7], [5,0], [5,1], [5,2], [5,3], [5,4], [5,5], [5,7], [6,0], [6,1], [6,2], [6,3], [6,4], [6,5], [6,7], [7,0], [7,1], [7,2], [7,3], [7,4], [7,5], [7,6], [7,7] ]
        },
        hard: {
            size: 10, cellSize: 38,
            solution: [
                ['N', 'A', 'T', 'U', 'R', 'A', 'L', 'E', 'Z', 'A'],
                ['', '', '', '', '', '', '', '', '', ''],
                ['F', 'E', 'L', 'I', 'C', 'I', 'D', 'A', 'D', ''],
                ['', '', '', '', '', '', '', '', '', ''],
                ['S', 'E', 'R', 'E', 'N', 'I', 'D', 'A', 'D', ''],
                ['', '', '', '', '', '', '', '', '', ''],
                ['A', 'R', 'M', 'O', 'N', 'I', 'A', '', '', ''],
                ['', '', '', '', '', '', '', '', '', ''],
                ['G', 'R', 'A', 'T', 'I', 'T', 'U', 'D', '', ''],
                ['', '', '', '', '', '', '', '', '', '']
            ],
            clues: {
                across: [
                    { number: 1, text: '1. Todo lo que no es hecho por el hombre (10 letras)', startRow: 0, startCol: 0 },
                    { number: 3, text: '3. Sentimiento de mucha alegría y contento (9 letras)', startRow: 2, startCol: 0 },
                    { number: 5, text: '5. Estado de mucha calma y tranquilidad (9 letras)', startRow: 4, startCol: 0 },
                    { number: 7, text: '7. Estado de equilibrio y concordia (7 letras)', startRow: 6, startCol: 0 },
                    { number: 9, text: '9. Sentimiento de agradecimiento por algo recibido (9 letras)', startRow: 8, startCol: 0 }
                ],
                down: [
                    { number: 2, text: '2. Sentimiento de afecto y aprecio (4 letras)', startRow: 0, startCol: 1 }
                ]
            },
            blackCells: [ [1,0], [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], [1,8], [1,9], [3,0], [3,1], [3,2], [3,3], [3,4], [3,5], [3,6], [3,7], [3,8], [3,9], [5,0], [5,1], [5,2], [5,3], [5,4], [5,5], [5,6], [5,7], [5,8], [5,9], [7,0], [7,1], [7,2], [7,3], [7,4], [7,5], [7,6], [7,7], [7,8], [7,9], [9,0], [9,1], [9,2], [9,3], [9,4], [9,5], [9,6], [9,7], [9,8], [9,9], [2,9], [4,9], [6,7], [6,8], [6,9], [8,8], [8,9] ]
        }
    };

    if (crosswordToggle && crosswordGame) {
        crosswordToggle.addEventListener('click', () => {
            if (crosswordGame.style.display === 'none') {
                crosswordGame.style.display = 'block';
                if (!crosswordGrid.children.length) initCrossword();
            } else {
                crosswordGame.style.display = 'none';
            }
        });
    }

    crosswordDifficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            crosswordDifficultyBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'var(--white)';
            });
            btn.classList.add('active');
            btn.style.background = 'linear-gradient(135deg, var(--blue-soft) 0%, var(--blue-pastel) 100%)';
            currentCrosswordDifficulty = btn.getAttribute('data-level');
            initCrossword();
        });
    });

    function initCrossword() {
        if (!crosswordGrid) return;
        renderCrossword();
    }

    function renderCrossword() {
        const puzzle = crosswordPuzzles[currentCrosswordDifficulty];
        crosswordGrid.innerHTML = '';
        crosswordGrid.style.gridTemplateColumns = `repeat(${puzzle.size}, ${puzzle.cellSize}px)`;
        acrossClues.innerHTML = '';
        downClues.innerHTML = '';

        puzzle.clues.across.forEach(clue => {
            const li = document.createElement('li');
            li.style.padding = '5px 0';
            li.style.cursor = 'pointer';
            li.textContent = clue.text;
            li.addEventListener('click', () => {
                stopSpeech();
                speakText(clue.text, li);
            });
            acrossClues.appendChild(li);
        });

        puzzle.clues.down.forEach(clue => {
            const li = document.createElement('li');
            li.style.padding = '5px 0';
            li.style.cursor = 'pointer';
            li.textContent = clue.text;
            li.addEventListener('click', () => {
                stopSpeech();
                speakText(clue.text, li);
            });
            downClues.appendChild(li);
        });

        for (let row = 0; row < puzzle.size; row++) {
            for (let col = 0; col < puzzle.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'crossword-cell';
                cell.style.width = `${puzzle.cellSize}px`;
                cell.style.height = `${puzzle.cellSize}px`;
                const isBlack = puzzle.blackCells.some(c => c[0] === row && c[1] === col);
                
                if (isBlack) {
                    cell.className += ' black';
                } else {
                    const input = document.createElement('input');
                    input.maxLength = 1;
                    input.style.fontSize = `${puzzle.cellSize * 0.5}px`;
                    input.dataset.row = row;
                    input.dataset.col = col;
                    
                    puzzle.clues.across.concat(puzzle.clues.down).forEach((clue) => {
                        if (clue.startRow === row && clue.startCol === col) {
                            const num = document.createElement('span');
                            num.className = 'number';
                            num.style.fontSize = `${puzzle.cellSize * 0.3}px`;
                            num.textContent = clue.number;
                            cell.appendChild(num);
                        }
                    });
                    
                    cell.appendChild(input);
                }
                crosswordGrid.appendChild(cell);
            }
        }
    }

    if (crosswordCheck) {
        crosswordCheck.addEventListener('click', () => {
            const puzzle = crosswordPuzzles[currentCrosswordDifficulty];
            let allFilled = true;
            let allCorrect = true;
            const inputs = crosswordGrid.querySelectorAll('input');
            inputs.forEach(input => {
                const row = parseInt(input.dataset.row);
                const col = parseInt(input.dataset.col);
                const cell = input.parentElement;
                cell.classList.remove('error', 'correct');
                
                if (input.value === '') {
                    allFilled = false;
                } else if (input.value.toUpperCase() === puzzle.solution[row][col]) {
                    cell.classList.add('correct');
                } else {
                    cell.classList.add('error');
                    allCorrect = false;
                }
            });
            if (allFilled && allCorrect) {
                setTimeout(() => {
                    alert('¡Felicidades! Crucigrama resuelto 🎉');
                    celebrateGameCompletion('¡¡¡Felicidades!!! ¡Has completado el crucigrama! ¡Fantástico trabajo!');
                }, 100);
            }
        });
    }

    if (crosswordReset) crosswordReset.addEventListener('click', initCrossword);

    // ---- Solitaire Logic ----
    const solitaireToggle = document.getElementById('solitaire-toggle');
    const solitaireGame = document.getElementById('solitaire-game');
    const solitaireBoard = document.getElementById('solitaire-board');
    const solitaireReset = document.getElementById('solitaire-reset');

    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let deck = [];
    let tableau = [];
    let foundations = [];
    let stock = [];
    let waste = [];

    if (solitaireToggle && solitaireGame) {
        solitaireToggle.addEventListener('click', () => {
            if (solitaireGame.style.display === 'none') {
                solitaireGame.style.display = 'block';
                if (!solitaireBoard.children.length) initSolitaire();
            } else {
                solitaireGame.style.display = 'none';
            }
        });
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function initSolitaire() {
        if (!solitaireBoard) return;
        deck = [];
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value, faceUp: false, id: Math.random() });
            }
        }
        shuffle(deck);
        tableau = Array(7).fill().map(() => []);
        foundations = Array(4).fill().map(() => []);
        stock = [];
        waste = [];
        let cardIndex = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = deck[cardIndex++];
                if (j === i) card.faceUp = true;
                tableau[j].push(card);
            }
        }
        while (cardIndex < deck.length) {
            stock.push(deck[cardIndex++]);
        }
        renderSolitaire();
    }

    function renderSolitaire() {
        solitaireBoard.innerHTML = '';
        solitaireBoard.style.flexWrap = 'wrap';
        solitaireBoard.style.gap = '20px';
        solitaireBoard.style.padding = '20px';

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.gap = '15px';
        topRow.style.width = '100%';
        topRow.style.justifyContent = 'center';
        topRow.style.marginBottom = '30px';

        const stockPile = document.createElement('div');
        stockPile.className = 'solitaire-pile';
        stockPile.style.minHeight = '120px';
        stockPile.addEventListener('click', () => {
            if (stock.length > 0) {
                const card = stock.pop();
                card.faceUp = true;
                waste.push(card);
            } else {
                while (waste.length > 0) {
                    const card = waste.pop();
                    card.faceUp = false;
                    stock.push(card);
                }
            }
            renderSolitaire();
        });
        if (stock.length > 0) {
            const cardEl = createCardElement(stock[stock.length - 1], false);
            stockPile.appendChild(cardEl);
        } else {
            stockPile.innerHTML = '<span style="opacity:0.5;font-size:2rem;">🃏</span>';
        }
        topRow.appendChild(stockPile);

        const wastePile = document.createElement('div');
        wastePile.className = 'solitaire-pile';
        wastePile.style.minHeight = '120px';
        if (waste.length > 0) {
            const card = waste[waste.length - 1];
            const cardEl = createCardElement(card, true);
            cardEl.addEventListener('click', () => handleCardClick(card, 'waste'));
            wastePile.appendChild(cardEl);
        } else {
            wastePile.innerHTML = '<span style="opacity:0.5;font-size:2rem;">⬜</span>';
        }
        topRow.appendChild(wastePile);

        for (let i = 0; i < 4; i++) {
            const foundation = document.createElement('div');
            foundation.className = 'solitaire-pile';
            foundation.style.minHeight = '120px';
            foundation.dataset.foundation = i;
            foundation.addEventListener('click', () => handleFoundationClick(i));
            if (foundations[i].length > 0) {
                const card = foundations[i][foundations[i].length - 1];
                const cardEl = createCardElement(card, true);
                foundation.appendChild(cardEl);
            } else {
                foundation.innerHTML = `<span style="opacity:0.5;font-size:2rem;">${suits[i]}</span>`;
            }
            topRow.appendChild(foundation);
        }

        solitaireBoard.appendChild(topRow);

        const bottomRow = document.createElement('div');
        bottomRow.style.display = 'flex';
        bottomRow.style.gap = '10px';
        bottomRow.style.width = '100%';
        bottomRow.style.justifyContent = 'center';
        bottomRow.style.flexWrap = 'wrap';

        for (let i = 0; i < 7; i++) {
            const pile = document.createElement('div');
            pile.className = 'solitaire-pile';
            pile.style.minHeight = '200px';
            pile.dataset.tableau = i;
            pile.addEventListener('click', (e) => handleTableauClick(i, e));
            
            if (tableau[i].length === 0) {
                pile.innerHTML = '<span style="opacity:0.5;font-size:2rem;">⬜</span>';
            } else {
                tableau[i].forEach((card, idx) => {
                    const cardEl = createCardElement(card, card.faceUp);
                    if (card.faceUp) {
                        cardEl.dataset.tableauIndex = i;
                        cardEl.dataset.cardIndex = idx;
                        cardEl.addEventListener('click', (e) => {
                            e.stopPropagation();
                            handleCardClick(card, 'tableau', i, idx);
                        });
                    }
                    pile.appendChild(cardEl);
                });
            }
            bottomRow.appendChild(pile);
        }

        solitaireBoard.appendChild(bottomRow);
    }

    function createCardElement(card, isFaceUp) {
        const el = document.createElement('div');
        el.className = 'solitaire-card';
        el.style.marginTop = '-75px';
        el.style.zIndex = '1';
        
        // Fix top margin for first child logic in JS since it's dynamic
        if (el.parentNode && el.parentNode.children.length === 0) {
            el.style.marginTop = '0';
        }

        if (!isFaceUp) {
            el.className += ' face-down';
        } else {
            const isRed = card.suit === '♥' || card.suit === '♦';
            el.className += isRed ? ' red' : ' black';
            el.innerHTML = `
                <div class="top">${card.value}${card.suit}</div>
                <div class="middle">${card.suit}</div>
                <div class="bottom">${card.value}${card.suit}</div>
            `;
        }
        return el;
    }

    let selectedCard = null;
    let selectedSource = null;
    let selectedSourceIndex = null;

    function handleCardClick(card, source, tableauIndex = null) {
        selectedCard = card;
        selectedSource = source;
        selectedSourceIndex = tableauIndex;
        // Optionally highlight the selected card visually here
        // alert('Carta seleccionada: ' + card.value + card.suit + '\nHaz clic en una pila para moverla');
    }

    function handleTableauClick(tableauIndex, event) {
        if (selectedCard) {
            const tableauPile = tableau[tableauIndex];
            if (tableauPile.length === 0) {
                if (selectedCard.value === 'K') {
                    moveCard(selectedCard, selectedSource, 'tableau', tableauIndex);
                }
            } else {
                const topCard = tableauPile[tableauPile.length - 1];
                const currentValueIndex = values.indexOf(selectedCard.value);
                const topValueIndex = values.indexOf(topCard.value);
                const isAlternateColor = (topCard.suit === '♥' || topCard.suit === '♦') !== (selectedCard.suit === '♥' || selectedCard.suit === '♦');
                
                if (currentValueIndex === topValueIndex - 1 && isAlternateColor) {
                    moveCard(selectedCard, selectedSource, 'tableau', tableauIndex);
                }
            }
        }
        selectedCard = null;
        selectedSource = null;
        selectedSourceIndex = null;
    }

    function handleFoundationClick(foundationIndex) {
        if (selectedCard) {
            const foundationPile = foundations[foundationIndex];
            const expectedSuit = suits[foundationIndex];
            
            if (foundationPile.length === 0) {
                if (selectedCard.value === 'A' && selectedCard.suit === expectedSuit) {
                    moveCard(selectedCard, selectedSource, 'foundation', foundationIndex);
                }
            } else {
                const topCard = foundationPile[foundationPile.length - 1];
                const currentValueIndex = values.indexOf(selectedCard.value);
                const topValueIndex = values.indexOf(topCard.value);
                
                if (selectedCard.suit === expectedSuit && currentValueIndex === topValueIndex + 1) {
                    moveCard(selectedCard, selectedSource, 'foundation', foundationIndex);
                }
            }
        }
        selectedCard = null;
        selectedSource = null;
        selectedSourceIndex = null;
    }

    function moveCard(card, sourceType, targetType, targetIndex) {
        if (sourceType === 'waste') {
            waste = waste.filter(c => c.id !== card.id);
        } else if (sourceType === 'tableau') {
            // Remove from source tableau
            const sourcePile = tableau[selectedSourceIndex];
            const cardIndex = sourcePile.findIndex(c => c.id === card.id);
            // Move card and all cards on top of it
            const cardsToMove = sourcePile.splice(cardIndex);
            
            // Flip the new top card of source pile if needed
            if (sourcePile.length > 0) {
                sourcePile[sourcePile.length - 1].faceUp = true;
            }

            if (targetType === 'tableau') {
                tableau[targetIndex].push(...cardsToMove);
            } else if (targetType === 'foundation') {
                foundations[targetIndex].push(cardsToMove[0]); // Only one card can move to foundation
            }
        }
        
        if (sourceType !== 'tableau') { // Already handled above
            if (targetType === 'tableau') {
                tableau[targetIndex].push(card);
            } else if (targetType === 'foundation') {
                foundations[targetIndex].push(card);
            }
        }
        
        checkWin();
        renderSolitaire();
    }

    function checkWin() {
        const allFoundationsFull = foundations.every(pile => pile.length === 13);
        if (allFoundationsFull) {
            setTimeout(() => {
                alert('¡Felicidades! Has ganado el Solitario 🎉');
                celebrateGameCompletion('¡¡¡Felicidades!!! ¡Has ganado el Solitario! ¡Eres increíble!');
            }, 300);
        }
    }

    if (solitaireReset) {
        solitaireReset.addEventListener('click', () => {
            selectedCard = null;
            selectedSource = null;
            selectedSourceIndex = null;
            initSolitaire();
        });
    }

    // ---- AR Logic ----
    const btnStartAR = document.getElementById('btn-start-ar');
    const exitArBtn = document.getElementById('exit-ar-btn');
    const arContainer = document.getElementById('ar-container');
    const videoBg = document.getElementById('ar-video-background');
    const mainContainerUI = document.getElementById('main-container');
    const landingPageUI = document.getElementById('landing-page');
    let cameraStream = null;

    function renderDefaultMemories() {
        const container = document.getElementById('memories-container');
        if (!container) return;
        container.innerHTML = '';
        const recuerdos = [
            { imagen: '/assets/memory1.png', titulo: 'Recuerdo Familiar' },
            { imagen: '/assets/memory2.png', titulo: 'Viaje a la Playa' }
        ];

        recuerdos.forEach((rec, index) => {
            const total = recuerdos.length;
            const maxRange = 90;
            const angle = total === 1 ? 0 : ((index / (total - 1)) - 0.5) * maxRange;
            const angleRad = (angle * Math.PI) / 180;
            const radius = 2.3;
            const x = radius * Math.sin(angleRad);
            const z = -radius * Math.cos(angleRad);
            const y = (index % 2 === 0 ? 0.15 : -0.15) + (index * 0.02);

            const memoryEntity = document.createElement('a-entity');
            memoryEntity.setAttribute('position', `${x} ${y} ${z}`);
            memoryEntity.setAttribute('rotation', `0 0 0`);

            const targetY = y + 0.12;
            const animDuration = 3000 + (index * 300);
            memoryEntity.setAttribute('animation', `
                property: position; 
                dir: alternate; 
                dur: ${animDuration}; 
                to: ${x} ${targetY} ${z}; 
                loop: true; 
                easing: easeInOutSine
            `);

            const photoPlane = document.createElement('a-plane');
            photoPlane.setAttribute('src', rec.imagen);
            photoPlane.setAttribute('width', '1.1');
            photoPlane.setAttribute('height', '0.85');
            photoPlane.setAttribute('position', '0 0.1 0.01');
            photoPlane.setAttribute('material', 'shader: flat; side: double;');

            const framePlane = document.createElement('a-plane');
            framePlane.setAttribute('color', '#ffffff');
            framePlane.setAttribute('width', '1.2');
            framePlane.setAttribute('height', '1.2');
            framePlane.setAttribute('position', '0 -0.05 0');
            framePlane.setAttribute('material', 'side: double;');

            const labelText = document.createElement('a-text');
            labelText.setAttribute('value', rec.titulo);
            labelText.setAttribute('color', '#0A369D');
            labelText.setAttribute('align', 'center');
            labelText.setAttribute('width', '1.6');
            labelText.setAttribute('position', '0 -0.45 0.02');

            memoryEntity.appendChild(photoPlane);
            memoryEntity.appendChild(framePlane);
            memoryEntity.appendChild(labelText);
            container.appendChild(memoryEntity);
        });
    }

    // ---- Web-AR Login & Scanner Logic ----
    const arLoginView = document.getElementById('ar-login-view');
    const arStartView = document.getElementById('ar-start-view');
    const btnStartScanner = document.getElementById('btn-start-scanner');
    const btnCancelScanner = document.getElementById('btn-cancel-scanner');
    const qrReaderContainer = document.getElementById('qr-reader-container');
    const scannerStatus = document.getElementById('scanner-status');
    const arWelcomeMsg = document.getElementById('ar-welcome-msg');
    const btnLogoutAr = document.getElementById('btn-logout-ar');
    let html5QrCode = null;

    function updateArTabUI() {
        const user = obtenerUsuarioActivo();
        if (user) {
            arLoginView.style.display = 'none';
            arStartView.style.display = 'block';
            arWelcomeMsg.textContent = `¡Bienvenido, ${user.nombre}!`;
        } else {
            arStartView.style.display = 'none';
            arLoginView.style.display = 'block';
        }
    }

    if (btnLogoutAr) {
        btnLogoutAr.addEventListener('click', () => {
            cerrarSesion();
            updateArTabUI();
        });
    }

    if (btnStartScanner) {
        btnStartScanner.addEventListener('click', () => {
            qrReaderContainer.style.display = 'block';
            btnStartScanner.style.display = 'none';
            scannerStatus.textContent = "Buscando cámara...";
            scannerStatus.style.color = "var(--blue-dark)";
            
            html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (qrMessage) => {
                    const user = iniciarSesion(qrMessage);
                    if (user) {
                        scannerStatus.textContent = `¡Código reconocido! Bienvenido ${user.nombre}...`;
                        scannerStatus.style.color = '#4ade80';
                        html5QrCode.stop().then(() => {
                            html5QrCode = null;
                            qrReaderContainer.style.display = 'none';
                            btnStartScanner.style.display = 'inline-block';
                            updateArTabUI();
                        });
                    } else {
                        scannerStatus.textContent = "Código no válido.";
                        scannerStatus.style.color = '#ef4444';
                        setTimeout(() => {
                            scannerStatus.textContent = "Centra tu código QR frente a la cámara.";
                            scannerStatus.style.color = "var(--blue-dark)";
                        }, 2000);
                    }
                },
                (errorMessage) => { }
            ).catch(err => {
                scannerStatus.textContent = "No se pudo iniciar la cámara trasera.";
                // Fallback a camara frontal/default
                html5QrCode.start({ videoConstraints: {} }, { fps: 10, qrbox: { width: 250, height: 250 } })
                    .catch(e => {
                        scannerStatus.textContent = "Error al iniciar cámara. Permite el acceso a la cámara.";
                    });
            });
        });
    }

    if (btnCancelScanner) {
        btnCancelScanner.addEventListener('click', () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    html5QrCode = null;
                });
            }
            qrReaderContainer.style.display = 'none';
            btnStartScanner.style.display = 'inline-block';
        });
    }

    // Call it initially when Web-AR tab is clicked
    document.querySelector('.tab-btn[data-tab="webar"]').addEventListener('click', () => {
        updateArTabUI();
    });

    async function startCameraAR() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Tu navegador no soporta acceso a la cámara. Intenta usar Chrome en tu celular.');
            return false;
        }
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            videoBg.srcObject = cameraStream;
            videoBg.style.display = 'block';
            return true;
        } catch (err) {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                videoBg.srcObject = cameraStream;
                videoBg.style.display = 'block';
                return true;
            } catch (err2) {
                alert('No se pudo abrir la cámara. Verifica los permisos.');
                return false;
            }
        }
    }

    function stopCameraAR() {
        if (videoBg) {
            videoBg.style.display = 'none';
            videoBg.srcObject = null;
        }
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    if (btnStartAR) {
        btnStartAR.addEventListener('click', async () => {
            const cameraOk = await startCameraAR();
            if (cameraOk) {
                mainContainerUI.style.display = 'none';
                landingPageUI.style.display = 'none';
                arContainer.style.display = 'block';
                exitArBtn.style.display = 'block';
                renderDefaultMemories();
                
                // Disparar redimensionamiento para A-Frame
                window.dispatchEvent(new Event('resize'));
            }
        });
    }

    if (exitArBtn) {
        exitArBtn.addEventListener('click', () => {
            stopCameraAR();
            arContainer.style.display = 'none';
            exitArBtn.style.display = 'none';
            mainContainerUI.style.display = 'block';
        });
    }

})();
