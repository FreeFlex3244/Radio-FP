const radioGrid = document.getElementById('radio-grid');
    const searchInput = document.getElementById('search-input');
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const currentName = document.getElementById('current-name');
    const currentStatus = document.getElementById('current-status');
    const currentLogo = document.getElementById('current-logo');
    const carModeToggle = document.getElementById('car-mode-toggle');
    const voiceSearchBtn = document.getElementById('voice-search');
    const themeSelector = document.getElementById('theme-selector');

    let favorites = JSON.parse(localStorage.getItem('radio-favorites') || '[]');
    let currentRadio = null;
    let isCarMode = localStorage.getItem('car-mode') === 'true';
    let currentTheme = localStorage.getItem('theme') || 'spotify';
    let retryCount = 0;
    const MAX_RETRIES = 5;

    // Visualizer Variables
    let audioContext, analyser, source, dataArray, canvas, canvasCtx;

    function init() {
        initVisualizer();

        if (isCarMode) {
            document.body.classList.add('car-mode');
            carModeToggle.classList.add('active');
        }

        applyTheme(currentTheme);
        themeSelector.value = currentTheme;

        renderRadios();

        searchInput.addEventListener('input', () => renderRadios());

        themeSelector.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });

        carModeToggle.addEventListener('click', () => {
            isCarMode = !isCarMode;
            document.body.classList.toggle('car-mode', isCarMode);
            carModeToggle.classList.toggle('active', isCarMode);
            localStorage.setItem('car-mode', isCarMode);
            renderRadios();
        });

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceSearchBtn.style.display = 'none';
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'fr-FR';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript;
                renderRadios();
                // If there's exactly one match, play it!
                const term = transcript.toLowerCase();
                const matches = radioData.filter(r => r.name.toLowerCase().includes(term));
                if (matches.length === 1) {
                    selectRadio(matches[0]);
                }
            };

            recognition.onstart = () => { voiceSearchBtn.classList.add('active'); };
            recognition.onend = () => { voiceSearchBtn.classList.remove('active'); };
            recognition.onerror = () => { voiceSearchBtn.classList.remove('active'); };

            voiceSearchBtn.addEventListener('click', () => {
                recognition.start();
            });
        }

        playBtn.addEventListener('click', togglePlay);

        audioPlayer.addEventListener('playing', () => {
            playIcon.textContent = '⏸';
            currentStatus.textContent = 'En direct';
            document.body.classList.remove('buffering');
            retryCount = 0;
            updateMediaSession();
        });

        audioPlayer.addEventListener('pause', () => {
            playIcon.textContent = '▶';
            currentStatus.textContent = 'Pause';
        });

        audioPlayer.addEventListener('waiting', () => {
            document.body.classList.add('buffering');
            currentStatus.textContent = 'Chargement...';
        });

        audioPlayer.addEventListener('error', handleAudioError);
        audioPlayer.addEventListener('stalled', handleAudioError);

        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => audioPlayer.play());
            navigator.mediaSession.setActionHandler('pause', () => audioPlayer.pause());
            navigator.mediaSession.setActionHandler('stop', () => {
                audioPlayer.pause();
                audioPlayer.src = '';
                currentStatus.textContent = 'Arrêté';
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => playAdjacent(-1));
            navigator.mediaSession.setActionHandler('nexttrack', () => playAdjacent(1));
        }
    }

    function renderRadios() {
        const term = searchInput.value.toLowerCase();
        let filtered = radioData.filter(r => r.name.toLowerCase().includes(term));

        // In car mode, if there's no search, prioritize favorites
        if (isCarMode && !term && favorites.length > 0) {
            const favs = filtered.filter(r => favorites.includes(r.url));
            const others = filtered.filter(r => !favorites.includes(r.url));
            filtered = [...favs, ...others];
        } else {
            // Standard mode: sort by favorites first
            const favs = filtered.filter(r => favorites.includes(r.url));
            const others = filtered.filter(r => !favorites.includes(r.url));
            filtered = [...favs, ...others];
        }

        radioGrid.innerHTML = '';

        if (filtered.length === 0) {
            radioGrid.innerHTML = '<div class="empty-favorites">Aucune radio trouvée</div>';
            return;
        }

        filtered.forEach(radio => {
            const isFav = favorites.includes(radio.url);
            const card = document.createElement('div');
            card.className = 'radio-card';
            if (currentRadio && currentRadio.url === radio.url) {
                card.classList.add('active');
            }

            const favBtn = document.createElement('button');
            favBtn.className = `fav-btn ${isFav ? 'active' : ''}`;
            favBtn.innerHTML = '★';
            favBtn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(radio);
                renderRadios();
            };

            const logo = document.createElement('div');
            logo.className = 'logo-container';
            if (radio.logo) {
                logo.style.backgroundImage = `url(${radio.logo})`;
                const img = new Image();
                img.src = radio.logo;
                img.onerror = () => {
                    // Try Google Favicon as fallback
                    if (radio.website) {
                        const domain = new URL(radio.website).hostname;
                        logo.style.backgroundImage = `url(https://www.google.com/s2/favicons?domain=${domain}&sz=128)`;
                    } else {
                        logo.style.backgroundImage = 'none';
                        logo.textContent = radio.name.charAt(0);
                    }
                };
            } else if (radio.website) {
                const domain = new URL(radio.website).hostname;
                logo.style.backgroundImage = `url(https://www.google.com/s2/favicons?domain=${domain}&sz=128)`;
            } else {
                logo.textContent = radio.name.charAt(0);
            }

            const name = document.createElement('div');
            name.className = 'radio-name';
            name.textContent = radio.name;

            card.appendChild(favBtn);
            card.appendChild(logo);
            card.appendChild(name);
            card.addEventListener('click', () => selectRadio(radio));
            radioGrid.appendChild(card);
        });
    }

    function applyTheme(theme) {
        document.body.classList.remove('theme-yt', 'theme-auto');
        if (theme !== 'spotify') {
            document.body.classList.add(`theme-${theme}`);
        }
        currentTheme = theme;
        localStorage.setItem('theme', theme);
        const color = theme === 'yt' ? '#ff0000' : (theme === 'auto' ? '#1a73e8' : '#1db954');
        document.querySelector('meta[name="theme-color"]').setAttribute('content', color);
    }

    function toggleFavorite(radio) {
        const index = favorites.indexOf(radio.url);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(radio.url);
        }
        localStorage.setItem('radio-favorites', JSON.stringify(favorites));
    }

    function handleAudioError() {
        if (currentRadio && !audioPlayer.paused && retryCount < MAX_RETRIES) {
            retryCount++;
            currentStatus.textContent = `Reconnexion... (${retryCount})`;
            setTimeout(() => {
                if (currentRadio) {
                    audioPlayer.src = currentRadio.url;
                    audioPlayer.load();
                    audioPlayer.play().catch(() => {});
                }
            }, 2000);
        } else if (retryCount >= MAX_RETRIES) {
            currentStatus.textContent = 'Flux indisponible';
            playIcon.textContent = '▶';
            document.body.classList.remove('buffering');
        }
    }

    function selectRadio(radio) {
        if (currentRadio && currentRadio.url === radio.url && !audioPlayer.paused) {
            togglePlay();
            return;
        }

        retryCount = 0;
        currentRadio = radio;
        currentName.textContent = radio.name;
        currentStatus.textContent = 'Chargement...';

        currentLogo.textContent = radio.logo ? '' : radio.name.charAt(0);
        currentLogo.style.backgroundImage = radio.logo ? `url(${radio.logo})` : 'none';

        audioPlayer.src = radio.url;
        audioPlayer.load();
        audioPlayer.play().catch(() => {});
        playBtn.disabled = false;

        document.querySelectorAll('.radio-card').forEach(c => {
            c.classList.toggle('active', c.querySelector('.radio-name').textContent === radio.name);
        });

        updateMediaSession();
    }

    function togglePlay() {
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    }

    function playAdjacent(offset) {
        const term = searchInput.value.toLowerCase();
        let list = radioData.filter(r => r.name.toLowerCase().includes(term));
        if (favorites.length > 0 && !term) {
             const favs = list.filter(r => favorites.includes(r.url));
             const others = list.filter(r => !favorites.includes(r.url));
             list = [...favs, ...others];
        }

        if (!currentRadio || list.length === 0) return;

        let index = list.findIndex(r => r.url === currentRadio.url);
        if (index === -1) index = 0;

        let nextIndex = (index + offset + list.length) % list.length;
        selectRadio(list[nextIndex]);
    }

    function updateMediaSession() {
        if ('mediaSession' in navigator && currentRadio) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentRadio.name,
                artist: 'Radio Direct',
                album: 'Streaming Français',
                artwork: currentRadio.logo ? [
                    { src: currentRadio.logo, sizes: '96x96', type: 'image/png' },
                    { src: currentRadio.logo, sizes: '128x128', type: 'image/png' },
                    { src: currentRadio.logo, sizes: '192x192', type: 'image/png' },
                    { src: currentRadio.logo, sizes: '256x256', type: 'image/png' },
                    { src: currentRadio.logo, sizes: '384x384', type: 'image/png' },
                    { src: currentRadio.logo, sizes: '512x512', type: 'image/png' },
                ] : [
                    { src: 'https://via.placeholder.com/512?text=Radio', sizes: '512x512', type: 'image/png' }
                ]
            });
        }
    }

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed', err));
        });
    }

    function initVisualizer() {
        canvas = document.getElementById('visualizer');
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvasCtx = canvas.getContext('2d');

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        const startAudio = () => {
            setupAudioContext();
            document.removeEventListener('click', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };

        document.addEventListener('click', startAudio);
        document.addEventListener('touchstart', startAudio);
    }

    function setupAudioContext() {
        if (audioContext) {
            if (audioContext.state === 'suspended') audioContext.resume();
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;

            try {
                source = audioContext.createMediaElementSource(audioPlayer);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
            } catch (e) {
                console.warn("CORS or AudioContext error:", e);
                // Fallback: just play audio normally (already happening)
            }

            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            drawVisualizer();
        } catch (e) {
            console.error(e);
        }
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);

        if (!analyser || !dataArray) return;
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < dataArray.length; i++) {
            barHeight = dataArray[i]; // Value 0-255

            // Draw mostly at the bottom
            const hue = (i * 2) + (Date.now() / 50);
            canvasCtx.fillStyle = `hsla(${hue}, 100%, 60%, 0.4)`;

            // Mirror effect or simple bars
            canvasCtx.fillRect(x, canvas.height - barHeight * 1.5, barWidth, barHeight * 1.5);

            x += barWidth + 1;
        }
    }

    init();