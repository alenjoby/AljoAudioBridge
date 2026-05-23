document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Visualizer Dots dynamically
    const visualizer = document.getElementById('audio-visualizer');
    const columnsCount = 14;
    const dotsPerColumn = 5;
    const columns = [];

    if (visualizer) {
        visualizer.innerHTML = '';
        for (let i = 0; i < columnsCount; i++) {
            const col = document.createElement('div');
            col.className = 'visualizer-column active';
            const dots = [];
            for (let j = 0; j < dotsPerColumn; j++) {
                const dot = document.createElement('div');
                dot.className = 'visualizer-dot';
                col.appendChild(dot);
                dots.push(dot);
            }
            visualizer.appendChild(col);
            columns.push({ element: col, dots: dots });
        }
    }

    // States
    let isMuted = false;
    let isClosed = false;
    let isRecordingDemo = false;
    let recordingSeconds = 0;
    let recordingInterval = null;

    // 2. Animation Loop for Audio Visualizer
    let animationFrameId;
    let lastTime = 0;
    const colHeights = new Array(columnsCount).fill(0);

    function animateVisualizer(time) {
        if (isClosed || isMuted) {
            // If closed or muted, clear visualizer dots
            columns.forEach(col => {
                col.dots.forEach(dot => {
                    dot.classList.remove('lit', 'peak');
                });
            });
            animationFrameId = requestAnimationFrame(animateVisualizer);
            return;
        }

        // Limit update rate for matrix visualizer feel (approx 30fps)
        if (time - lastTime < 50) {
            animationFrameId = requestAnimationFrame(animateVisualizer);
            return;
        }
        lastTime = time;

        // Get volume scaling factor from the max volume of active routing devices
        let maxVolume = 0;
        for (let cardId = 1; cardId <= 3; cardId++) {
            const toggle = document.getElementById(`toggle-${cardId}`);
            const volumeLabel = document.getElementById(`val-${cardId}`);
            if (toggle && toggle.classList.contains('checked') && volumeLabel) {
                const vol = parseInt(volumeLabel.textContent) || 0;
                if (vol > maxVolume) maxVolume = vol;
            }
        }
        let scale = maxVolume / 100;
        if (isRecordingDemo) {
            scale = Math.min(1.15, scale * 1.15); // Apply visual boost when recording is running
        }

        // Calculate visualizer heights
        for (let i = 0; i < columnsCount; i++) {
            // Combination of slow waves and high frequency noise for realistic spectrum motion
            const wave = Math.sin(time * 0.003 + i * 0.4) * 1.5 + Math.sin(time * 0.008 + i * 0.7) * 1.0;
            const noise = Math.random() * 2.2;
            let target = Math.round((wave + noise + 1.2) * scale);
            target = Math.max(0, Math.min(dotsPerColumn, target));

            // Smooth the columns' transitions
            let current = colHeights[i];
            if (current < target) {
                current = Math.min(target, current + 2);
            } else if (current > target) {
                current = Math.max(target, current - 1);
            }
            colHeights[i] = current;

            // Update dot classes
            const dots = columns[i].dots;
            for (let j = 0; j < dotsPerColumn; j++) {
                dots[j].classList.remove('lit', 'peak');
                if (j < current) {
                    if (j === current - 1) {
                        dots[j].classList.add('peak');
                    } else {
                        dots[j].classList.add('lit');
                    }
                }
            }
        }

        animationFrameId = requestAnimationFrame(animateVisualizer);
    }

    // Start animation loop
    if (columns.length > 0) {
        animationFrameId = requestAnimationFrame(animateVisualizer);
    }

    // Helper to sync muted visual states
    const muteAllBtn = document.getElementById('demo-mute-all');
    
    function syncMutedState() {
        if (!muteAllBtn) return;
        if (isMuted) {
            muteAllBtn.classList.add('muted');
            muteAllBtn.textContent = 'Muted';
            document.querySelectorAll('.app-card').forEach(card => card.classList.add('muted-card'));
        } else {
            muteAllBtn.classList.remove('muted');
            muteAllBtn.textContent = 'Mute';
            
            // Restore default speaker card
            const card1 = document.getElementById('card-1');
            if (card1) card1.classList.remove('muted-card');

            // Restore Sony headphones based on switch
            const toggle2 = document.getElementById('toggle-2');
            const card2 = document.getElementById('card-2');
            if (card2) {
                if (toggle2 && toggle2.classList.contains('checked')) {
                    card2.classList.remove('muted-card');
                } else {
                    card2.classList.add('muted-card');
                }
            }

            // Restore Bluetooth Speaker based on switch
            const toggle3 = document.getElementById('toggle-3');
            const card3 = document.getElementById('card-3');
            if (card3) {
                if (toggle3 && toggle3.classList.contains('checked')) {
                    card3.classList.remove('muted-card');
                } else {
                    card3.classList.add('muted-card');
                }
            }
        }
    }

    // 3. Mute All Button Toggle
    if (muteAllBtn) {
        muteAllBtn.addEventListener('click', () => {
            if (isClosed) return;
            isMuted = !isMuted;
            syncMutedState();
        });
    }

    // 4. Mini Mode Minimize Toggle
    const minimizeBtn = document.getElementById('demo-minimize');
    const appWindow = document.getElementById('app-window');
    if (minimizeBtn && appWindow) {
        minimizeBtn.addEventListener('click', () => {
            if (isClosed) return;
            appWindow.classList.toggle('mini-mode');
        });
    }

    // 5. Close/Terminate Demo
    const closeBtn = document.getElementById('demo-close');
    const closeOverlay = document.getElementById('close-overlay');
    if (closeBtn && closeOverlay) {
        closeBtn.addEventListener('click', () => {
            isClosed = true;
            closeOverlay.classList.add('show');
        });
    }

    // 6. Restart Demo Reset Button
    const restartBtn = document.getElementById('restart-demo-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            isClosed = false;
            isMuted = false;

            // Stop active recording interval
            if (recordingInterval) {
                clearInterval(recordingInterval);
                recordingInterval = null;
            }
            isRecordingDemo = false;

            // Switch back to Routing Tab
            switchTab('routing');

            // Reset recording UI values
            const btnStartRecord = document.getElementById('btn-start-record');
            const recStatus = document.getElementById('rec-status');
            const recTimer = document.getElementById('rec-timer');
            if (btnStartRecord) {
                btnStartRecord.textContent = 'START RECORDING';
                btnStartRecord.classList.remove('recording');
            }
            if (recStatus) {
                recStatus.textContent = 'Ready to Record';
                recStatus.style.color = '#aaaaaa';
            }
            if (recTimer) {
                recTimer.textContent = '00:00:00';
            }

            // Reset recording sliders
            const recSysFill = document.getElementById('rec-sys-fill');
            const recSysThumb = document.getElementById('rec-sys-thumb');
            const recSysVal = document.getElementById('rec-sys-val');
            if (recSysFill) recSysFill.style.width = '100%';
            if (recSysThumb) recSysThumb.style.left = '100%';
            if (recSysVal) recSysVal.textContent = '100%';

            const recMicFill = document.getElementById('rec-mic-fill');
            const recMicThumb = document.getElementById('rec-mic-thumb');
            const recMicVal = document.getElementById('rec-mic-val');
            if (recMicFill) recMicFill.style.width = '100%';
            if (recMicThumb) recMicThumb.style.left = '100%';
            if (recMicVal) recMicVal.textContent = '100%';

            // Reset path value
            const pathValueLabel = document.getElementById('rec-path-value');
            if (pathValueLabel) {
                pathValueLabel.textContent = 'C:\\Users\\User\\Music';
            }

            // Hide overlays
            if (closeOverlay) closeOverlay.classList.remove('show');
            const scanOverlay = document.getElementById('scan-overlay');
            if (scanOverlay) scanOverlay.classList.remove('show');

            // Reset Card 1 (Default Speaker)
            const fill1 = document.getElementById('fill-1');
            const thumb1 = document.getElementById('thumb-1');
            const val1 = document.getElementById('val-1');
            const select1 = document.getElementById('source-select-1');
            if (fill1) fill1.style.width = '85%';
            if (thumb1) thumb1.style.left = '85%';
            if (val1) val1.textContent = '85%';
            if (select1) select1.value = 'SYSTEM_LOOPBACK';

            // Reset Card 2 (Sony Headphones)
            const toggle2 = document.getElementById('toggle-2');
            if (toggle2) toggle2.classList.add('checked');
            const select2 = document.getElementById('source-select-2');
            if (select2) select2.value = 'SYSTEM_LOOPBACK';
            const fill2 = document.getElementById('fill-2');
            const thumb2 = document.getElementById('thumb-2');
            const val2 = document.getElementById('val-2');
            if (fill2) fill2.style.width = '70%';
            if (thumb2) thumb2.style.left = '70%';
            if (val2) val2.textContent = '70%';

            // Reset Card 3 (Bluetooth Audio Speaker)
            const card3Title = document.querySelector('#card-3 .device-title');
            if (card3Title) {
                card3Title.textContent = 'IK-S026E (Bluetooth Audio)';
                card3Title.setAttribute('title', 'IK-S026E (Bluetooth Audio)');
            }
            const toggle3 = document.getElementById('toggle-3');
            if (toggle3) toggle3.classList.remove('checked');
            const select3 = document.getElementById('source-select-3');
            if (select3) select3.value = 'SYSTEM_LOOPBACK';
            const fill3 = document.getElementById('fill-3');
            const thumb3 = document.getElementById('thumb-3');
            const val3 = document.getElementById('val-3');
            if (fill3) fill3.style.width = '50%';
            if (thumb3) thumb3.style.left = '50%';
            if (val3) val3.textContent = '50%';

            // Sync card status labels
            for (let i = 1; i <= 3; i++) {
                updateCardStatus(i);
            }

            // Sync mute states
            syncMutedState();
        });
    }

    // 7. Bluetooth Scan Settings overlays
    const btScanBtn = document.getElementById('demo-bt-scan');
    const scanOverlay = document.getElementById('scan-overlay');
    const closeScanBtn = document.getElementById('close-scan-btn');

    if (btScanBtn && scanOverlay) {
        btScanBtn.addEventListener('click', () => {
            if (isClosed) return;
            scanOverlay.classList.add('show');
        });
    }
    if (closeScanBtn && scanOverlay) {
        closeScanBtn.addEventListener('click', () => {
            scanOverlay.classList.remove('show');
        });
    }

    // 8. Bluetooth simulated device pairing
    function setupPairingButton(btnId, deviceName) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', () => {
            if (btn.textContent !== 'Connect') return;

            btn.textContent = 'Connecting...';
            btn.style.opacity = '0.7';

            setTimeout(() => {
                btn.textContent = 'Connected';
                btn.style.color = 'var(--success)';
                btn.style.opacity = '1';

                // Update Card 3 details with connected device
                const card3Title = document.querySelector('#card-3 .device-title');
                if (card3Title) {
                    card3Title.textContent = `${deviceName} (Bluetooth Audio)`;
                    card3Title.setAttribute('title', `${deviceName} (Bluetooth Audio)`);
                }

                // Check and enable Card 3
                const toggle3 = document.getElementById('toggle-3');
                if (toggle3) toggle3.classList.add('checked');
                
                const sliderContainer3 = document.getElementById('slider-container-3');
                if (sliderContainer3) sliderContainer3.classList.remove('disabled');

                const status3 = document.getElementById('status-3');
                if (status3) {
                    status3.className = 'device-status-dot routing';
                    status3.innerHTML = '&bull; Routing';
                }

                const card3 = document.getElementById('card-3');
                if (card3 && !isMuted) {
                    card3.classList.remove('muted-card');
                }

                // Auto-close scanning dialog
                setTimeout(() => {
                    if (scanOverlay) scanOverlay.classList.remove('show');
                    // Reset connect button style/text for future uses
                    btn.textContent = 'Connect';
                    btn.style.color = '';
                    btn.style.opacity = '';
                }, 800);
            }, 1200);
        });
    }

    setupPairingButton('pair-qc45', 'Bose QC45');
    setupPairingButton('pair-jbl', 'JBL Flip 6');

    // 9. Custom Slider dragging/clicking
    function setupCustomSlider(containerId, fillId, thumbId, labelId) {
        const container = document.getElementById(containerId);
        const fill = document.getElementById(fillId);
        const thumb = document.getElementById(thumbId);
        const label = document.getElementById(labelId);

        if (!container || !fill || !thumb || !label) return;

        let isDragging = false;

        function updateSlider(clientX) {
            if (container.classList.contains('disabled')) return;

            const rect = container.getBoundingClientRect();
            const width = rect.width;
            const x = clientX - rect.left;
            const pct = Math.round(Math.max(0, Math.min(100, (x / width) * 100)));

            fill.style.width = `${pct}%`;
            thumb.style.left = `${pct}%`;
            label.textContent = `${pct}%`;
        }

        container.addEventListener('pointerdown', (e) => {
            if (container.classList.contains('disabled')) return;
            isDragging = true;
            container.setPointerCapture(e.pointerId);
            updateSlider(e.clientX);
        });

        container.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            updateSlider(e.clientX);
        });

        container.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            container.releasePointerCapture(e.pointerId);
        });

        container.addEventListener('pointercancel', () => {
            isDragging = false;
        });
    }

    setupCustomSlider('slider-container-1', 'fill-1', 'thumb-1', 'val-1');
    setupCustomSlider('slider-container-2', 'fill-2', 'thumb-2', 'val-2');
    setupCustomSlider('slider-container-3', 'fill-3', 'thumb-3', 'val-3');

    // 10. Card Status Helper and Switch toggles
    function updateCardStatus(cardId) {
        const toggle = document.getElementById(`toggle-${cardId}`);
        const select = document.getElementById(`source-select-${cardId}`);
        const statusDot = document.getElementById(`status-${cardId}`);
        const card = document.getElementById(`card-${cardId}`);
        const sliderContainer = document.getElementById(`slider-container-${cardId}`);

        if (!toggle || !statusDot) return;

        const isChecked = toggle.classList.contains('checked');
        const source = select ? select.value : 'SYSTEM_LOOPBACK';

        if (isChecked) {
            if (sliderContainer) sliderContainer.classList.remove('disabled');
            if (cardId === 1) {
                if (source === 'SYSTEM_LOOPBACK') {
                    statusDot.className = 'device-status-dot default';
                    statusDot.innerHTML = '&bull; Default';
                } else {
                    statusDot.className = 'device-status-dot default';
                    statusDot.innerHTML = '&bull; Default (Mic)';
                }
            } else {
                statusDot.className = 'device-status-dot routing';
                statusDot.innerHTML = source === 'SYSTEM_LOOPBACK' ? '&bull; Routing' : '&bull; Routing (Mic)';
            }
            if (card && !isMuted) {
                card.classList.remove('muted-card');
            }
        } else {
            if (sliderContainer) sliderContainer.classList.add('disabled');
            statusDot.className = 'device-status-dot disconnected';
            statusDot.innerHTML = '&bull; Idle';
            if (card) card.classList.add('muted-card');
        }
    }

    function setupSwitch(toggleId, cardIdNumber) {
        const toggle = document.getElementById(toggleId);
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            if (toggle.classList.contains('disabled')) return;
            toggle.classList.toggle('checked');
            updateCardStatus(cardIdNumber);
        });
    }

    setupSwitch('toggle-2', 2);
    setupSwitch('toggle-3', 3);

    // Attach select dropdown change event listeners
    for (let cardId = 1; cardId <= 3; cardId++) {
        const select = document.getElementById(`source-select-${cardId}`);
        if (select) {
            select.addEventListener('change', () => updateCardStatus(cardId));
        }
    }

    // 10b. Mock Tab Control Switching
    const tabRouting = document.getElementById('tab-routing');
    const tabRecording = document.getElementById('tab-recording');
    const contentRouting = document.getElementById('tab-routing-content');
    const contentRecording = document.getElementById('tab-recording-content');

    function switchTab(activeTab) {
        if (!tabRouting || !tabRecording || !contentRouting || !contentRecording) return;
        if (activeTab === 'routing') {
            tabRouting.classList.add('active');
            tabRecording.classList.remove('active');
            contentRouting.classList.add('active');
            contentRecording.classList.remove('active');
        } else {
            tabRouting.classList.remove('active');
            tabRecording.classList.add('active');
            contentRouting.classList.remove('active');
            contentRecording.classList.add('active');
        }
    }

    if (tabRouting && tabRecording) {
        tabRouting.addEventListener('click', () => switchTab('routing'));
        tabRecording.addEventListener('click', () => switchTab('recording'));
    }

    // 10c. Recording Panel Gain Sliders
    setupCustomSlider('rec-sys-slider-container', 'rec-sys-fill', 'rec-sys-thumb', 'rec-sys-val');
    setupCustomSlider('rec-mic-slider-container', 'rec-mic-fill', 'rec-mic-thumb', 'rec-mic-val');

    // 10d. Click-to-Change Destination Save Path
    const pathValueLabel = document.getElementById('rec-path-value');
    if (pathValueLabel) {
        pathValueLabel.addEventListener('click', () => {
            const currentVal = pathValueLabel.textContent;
            const newVal = prompt("Enter custom recording save path:", currentVal);
            if (newVal && newVal.trim() !== '') {
                pathValueLabel.textContent = newVal.trim();
            }
        });
    }

    // 10e. Recording Action & Timer Simulation
    const btnStartRecord = document.getElementById('btn-start-record');
    const recStatus = document.getElementById('rec-status');
    const recTimer = document.getElementById('rec-timer');

    if (btnStartRecord) {
        btnStartRecord.addEventListener('click', () => {
            if (!isRecordingDemo) {
                isRecordingDemo = true;
                btnStartRecord.textContent = 'STOP RECORDING';
                btnStartRecord.classList.add('recording');
                if (recStatus) {
                    recStatus.textContent = 'Recording...';
                    recStatus.style.color = 'var(--danger)';
                }
                recordingSeconds = 0;
                if (recTimer) recTimer.textContent = '00:00:00';
                
                recordingInterval = setInterval(() => {
                    recordingSeconds++;
                    const h = Math.floor(recordingSeconds / 3600).toString().padStart(2, '0');
                    const m = Math.floor((recordingSeconds % 3600) / 60).toString().padStart(2, '0');
                    const s = Math.floor(recordingSeconds % 60).toString().padStart(2, '0');
                    if (recTimer) recTimer.textContent = `${h}:${m}:${s}`;
                }, 1000);
            } else {
                isRecordingDemo = false;
                if (recordingInterval) {
                    clearInterval(recordingInterval);
                    recordingInterval = null;
                }
                btnStartRecord.textContent = 'START RECORDING';
                btnStartRecord.classList.remove('recording');
                if (recStatus) {
                    recStatus.textContent = 'Recording Saved';
                    recStatus.style.color = 'var(--success)';
                }
            }
        });
    }

    // 11. Command Line winget Copy Command
    const copyBtn = document.getElementById('copy-btn');
    const copyIcon = document.getElementById('copy-icon');

    if (copyBtn && copyIcon) {
        copyBtn.addEventListener('click', () => {
            const commandText = 'winget install Aljo.AudioBridge';
            navigator.clipboard.writeText(commandText).then(() => {
                copyBtn.classList.add('success');
                copyIcon.innerHTML = `
                    <polyline points="20 6 9 17 4 12"></polyline>
                `;
                
                setTimeout(() => {
                    copyBtn.classList.remove('success');
                    copyIcon.innerHTML = `
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    `;
                }, 2000);
            });
        });
    }

    // 12. Full-Screen Canvas-Based Neon Yellow Liquid Mesh Gradient Flow (WebGL with 2D Fallback)
    const canvas = document.getElementById('bg-flow-canvas');
    if (canvas) {
        let gl;
        try {
            gl = canvas.getContext('webgl', { alpha: false, depth: false, antialias: true }) || 
                 canvas.getContext('experimental-webgl', { alpha: false, depth: false, antialias: true });
        } catch (e) {
            gl = null;
        }

        if (gl) {
            // WebGL Shaders
            const vsSource = `
                attribute vec2 position;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `;

            const fsSource = `
                precision mediump float;
                uniform vec2 u_resolution;
                uniform float u_time;

                // Simplex 2D noise
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

                float snoise(vec2 v){
                  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                   -0.577350269189626, 0.024390243902439);
                  vec2 i  = floor(v + dot(v, C.yy) );
                  vec2 x0 = v -   i + dot(i, C.xx) ;
                  vec2 i1;
                  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                  vec4 x12 = x0.xyxy + C.xxzz;
                  x12.xy -= i1;
                  i = mod(i, 289.0);
                  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                  + i.x + vec3(0.0, i1.x, 1.0 ));
                  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                    dot(x12.zw,x12.zw)), 0.0);
                  m = m*m ;
                  m = m*m ;
                  vec3 x = 2.0 * fract(p * C.www) - 1.0;
                  vec3 h = abs(x) - 0.5;
                  vec3 a0 = x - floor(x + 0.5);
                  vec3 g = a0*vec3(x0.x,x12.x,x12.z) + h*vec3(x0.y,x12.y,x12.w);
                  vec3 diff = 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                  m *= diff;
                  return 130.0 * dot(m, g);
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    float aspect = u_resolution.x / u_resolution.y;
                    vec2 p = uv;
                    p.x *= aspect;

                    float t = u_time * 0.12;

                    // Warp coordinate space with noise to produce realistic fluid current lines
                    vec2 warp1 = vec2(
                        snoise(p * 1.5 + vec2(t * 0.4, t * 0.3)),
                        snoise(p * 1.8 - vec2(t * 0.2, t * 0.5))
                    );

                    vec2 warp2 = vec2(
                        snoise(p * 2.5 + warp1 * 0.8 + vec2(0.0, t * 0.6)),
                        snoise(p * 2.0 + warp1 * 0.6 - vec2(t * 0.4, 0.0))
                    );

                    vec2 final_uv = p + warp2 * 0.15;

                    // Compute locations of color centers moving in dynamic Lissajous orbits
                    vec2 c1 = vec2(0.25 * aspect, 0.3) + vec2(sin(t * 0.4), cos(t * 0.3)) * 0.2;
                    vec2 c2 = vec2(0.75 * aspect, 0.7) + vec2(cos(t * 0.3), sin(t * 0.5)) * 0.2;
                    vec2 c3 = vec2(0.3 * aspect, 0.8) + vec2(sin(t * 0.5), sin(t * 0.3)) * 0.15;
                    vec2 c4 = vec2(0.8 * aspect, 0.2) + vec2(cos(t * 0.4), cos(t * 0.2)) * 0.25;

                    float d1 = length(final_uv - c1);
                    float d2 = length(final_uv - c2);
                    float d3 = length(final_uv - c3);
                    float d4 = length(final_uv - c4);

                    // Liquid mesh gradient color palette: Neon yellows, golds, and ambers
                    // Scaled down in brightness to maintain deep dark background readability
                    vec3 col1 = vec3(1.0, 0.85, 0.0) * 0.08;     // Neon Yellow (subtle glow)
                    vec3 col2 = vec3(1.0, 0.48, 0.0) * 0.06;     // Neon Amber
                    vec3 col3 = vec3(0.95, 0.68, 0.0) * 0.05;    // Bright Gold
                    vec3 col4 = vec3(0.75, 0.95, 0.0) * 0.04;    // Electric Lime-Yellow
                    vec3 col_bg = vec3(0.0078, 0.0078, 0.0156); // Deep Black (#020204)

                    // Exponential decay for beautiful soft gas-like glow with dark voids
                    float w1 = exp(-d1 * d1 * 25.0);
                    float w2 = exp(-d2 * d2 * 30.0);
                    float w3 = exp(-d3 * d3 * 20.0);
                    float w4 = exp(-d4 * d4 * 35.0);

                    vec3 active_color = w1 * col1 + w2 * col2 + w3 * col3 + w4 * col4;

                    // Blend with deep background black
                    vec3 final_color = col_bg + active_color;

                    // Soft ambient noise layer to prevent banding on compressed screens
                    float ambNoise = snoise(final_uv * 2.0 + t) * 0.008;
                    final_color += vec3(ambNoise * 1.2, ambNoise * 0.9, 0.0);

                    gl_FragColor = vec4(clamp(final_color, 0.0, 1.0), 1.0);
                }
            `;

            function createShader(gl, type, source) {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                    gl.deleteShader(shader);
                    return null;
                }
                return shader;
            }

            const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
            const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

            if (vs && fs) {
                const program = gl.createProgram();
                gl.attachShader(program, vs);
                gl.attachShader(program, fs);
                gl.linkProgram(program);

                if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    gl.useProgram(program);

                    const positionLoc = gl.getAttribLocation(program, 'position');
                    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
                    const timeLoc = gl.getUniformLocation(program, 'u_time');

                    const positionBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                        -1, -1,
                         1, -1,
                        -1,  1,
                        -1,  1,
                         1, -1,
                         1,  1,
                    ]), gl.STATIC_DRAW);

                    gl.enableVertexAttribArray(positionLoc);
                    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

                    // Resize WebGL viewport to half-resolution for optimal performance
                    function resize() {
                        const w = Math.ceil(window.innerWidth / 2);
                        const h = Math.ceil(window.innerHeight / 2);
                        if (canvas.width !== w || canvas.height !== h) {
                            canvas.width = w;
                            canvas.height = h;
                            gl.viewport(0, 0, w, h);
                        }
                    }
                    window.addEventListener('resize', resize);
                    resize();

                    const startTime = performance.now();
                    function render(now) {
                        const t = (now - startTime) * 0.001;
                        gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
                        gl.uniform1f(timeLoc, t);
                        gl.drawArrays(gl.TRIANGLES, 0, 6);
                        requestAnimationFrame(render);
                    }
                    requestAnimationFrame(render);
                    return; // Exit script block as WebGL successfully initialized
                }
            }
        }

        // --- 2D Fallback ---
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const width = 400;
            const height = 300;
            canvas.width = width;
            canvas.height = height;

            const blobs = [
                { cx: 0.25, cy: 0.3, rx: 0.2, ry: 0.2, sx: 0.4, sy: 0.3, r: 120, col: 'rgba(255, 210, 0, 0.15)' },
                { cx: 0.75, cy: 0.7, rx: 0.2, ry: 0.2, sx: -0.3, sy: 0.4, r: 130, col: 'rgba(255, 122, 0, 0.12)' },
                { cx: 0.5, cy: 0.5, rx: 0.25, ry: 0.2, sx: 0.5, sy: -0.3, r: 120, col: 'rgba(255, 173, 0, 0.1)' },
                { cx: 0.8, cy: 0.2, rx: 0.25, ry: 0.25, sx: 0.3, sy: 0.5, r: 110, col: 'rgba(191, 242, 0, 0.08)' }
            ];

            let flowTime = 0;
            let lastTimestamp = 0;

            function animateFlow2D(timestamp) {
                if (!lastTimestamp) lastTimestamp = timestamp;
                const delta = Math.min(50, timestamp - lastTimestamp);
                lastTimestamp = timestamp;
                flowTime += delta * 0.001;

                ctx.fillStyle = '#020204';
                ctx.fillRect(0, 0, width, height);

                blobs.forEach(b => {
                    const x = (b.cx + Math.sin(flowTime * b.sx) * b.rx) * width;
                    const y = (b.cy + Math.cos(flowTime * b.sy) * b.ry) * height;
                    
                    const grad = ctx.createRadialGradient(x, y, b.r * 0.1, x, y, b.r);
                    grad.addColorStop(0, b.col);
                    grad.addColorStop(1, 'rgba(2, 2, 4, 0)');
                    
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(x, y, b.r, 0, Math.PI * 2);
                    ctx.fill();
                });

                requestAnimationFrame(animateFlow2D);
            }
            requestAnimationFrame(animateFlow2D);
        }
    }
});

