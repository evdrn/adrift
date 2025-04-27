class LoadingInterface {
    constructor() {
        this.currentAudio = null;
        this.currentVideo = null;
        this.selectedAudioTrack = null;
        this.selectedVideo = null;
        this.introText = "Set your mind adrift...";
        this.typewriterSpeed = 100;
        this.introStarted = false; // Track if the intro has already been displayed
        
        // Start with the intro only once
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startIntro());
        } else {
            this.startIntro();
        }
    }

    async startIntro() {
        try {
            if (this.introStarted) return; // Avoid duplicate intros
            this.introStarted = true;

            const typedTextElement = document.getElementById('typed-text');
            if (!typedTextElement) {
                console.error('Typed text element not found');
                return;
            }

            // Type out the text
            for (let i = 0; i < this.introText.length; i++) {
                await this.wait(this.typewriterSpeed);
                typedTextElement.textContent += this.introText.charAt(i);
            }

            // Wait after typing is done
            await this.wait(1500);

            // Fade out intro screen and show music selection
            const introScreen = document.getElementById('intro-screen');
            const loadingInterface = document.getElementById('loading-interface');

            if (introScreen) introScreen.classList.remove('active');
            if (loadingInterface) loadingInterface.classList.add('active');

            // Initialize the rest of the interface
            this.initialize();
        } catch (error) {
            console.error('Error in startIntro:', error);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    initialize() {
        try {
            this.setupAudioSelection();
            this.setupVideoSelection();
            this.setupAudioControls();
        } catch (error) {
            console.error('Error in initialize:', error);
        }
    }

    setupAudioSelection() {
        try {
            const audioOptions = document.querySelectorAll('#audio-selection .option, #audio-selection .option-none');
            const confirmAudioBtn = document.getElementById('confirm-audio');

            if (!confirmAudioBtn) {
                console.error('Confirm audio button not found');
                return;
            }

            audioOptions.forEach(option => {
                const previewBtn = option.querySelector('.preview-btn');
                const audio = option.querySelector('audio');

                if (previewBtn && audio) {
                    previewBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent option click
                        this.previewAudio(audio, previewBtn);
                    });
                }

                option.addEventListener('click', () => {
                    audioOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    this.selectedAudioTrack = option.dataset.track;
                    
                    // If currently previewing, stop it
                    if (this.currentAudio) {
                        this.currentAudio.pause();
                        this.currentAudio.currentTime = 0;
                        document.querySelectorAll('.preview-btn').forEach(btn => btn.textContent = 'Preview');
                        this.currentAudio = null;
                    }
                });
            });

            confirmAudioBtn.addEventListener('click', () => {
                if (!this.selectedAudioTrack) {
                    this.selectedAudioTrack = 'none';
                }
                if (this.currentAudio) {
                    this.currentAudio.pause();
                }
                const audioSelection = document.getElementById('audio-selection');
                const videoSelection = document.getElementById('video-selection');
                if (audioSelection) audioSelection.classList.remove('active');
                if (videoSelection) videoSelection.classList.add('active');
            });
        } catch (error) {
            console.error('Error in setupAudioSelection:', error);
        }
    }

    setupVideoSelection() {
        try {
            const videoOptions = document.querySelectorAll('#video-selection .option, #video-selection .option-none');
            const confirmVideoBtn = document.getElementById('confirm-video');

            if (!confirmVideoBtn) {
                console.error('Confirm video button not found');
                return;
            }

            videoOptions.forEach(option => {
                const previewVideo = option.querySelector('.preview-video');
                
                if (previewVideo) {
                    option.addEventListener('mouseenter', () => {
                        previewVideo.play().catch(err => console.error('Video preview failed:', err));
                    });

                    option.addEventListener('mouseleave', () => {
                        previewVideo.pause();
                        previewVideo.currentTime = 0;
                    });
                }

                option.addEventListener('click', () => {
                    videoOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    this.selectedVideo = option.dataset.video;
                });
            });

            confirmVideoBtn.addEventListener('click', () => {
                if (!this.selectedVideo) {
                    this.selectedVideo = 'none';
                }
                document.getElementById('video-selection').classList.remove('active');
                this.startLoading();
            });
        } catch (error) {
            console.error('Error in setupVideoSelection:', error);
        }
    }

    setupAudioControls() {
        try {
            const toggleAudio = document.getElementById('toggle-audio');
            const volumeSlider = document.getElementById('volume-slider');
            const audioControls = document.getElementById('audio-controls');

            if (!toggleAudio || !volumeSlider) {
                console.error('Audio controls not found');
                return;
            }

            toggleAudio.addEventListener('click', () => {
                if (this.currentAudio) {
                    if (this.currentAudio.paused) {
                        this.currentAudio.play();
                        toggleAudio.textContent = '🔊';
                    } else {
                        this.currentAudio.pause();
                        toggleAudio.textContent = '🔈';
                    }
                }
            });

            volumeSlider.addEventListener('input', (e) => {
                if (this.currentAudio) {
                    this.currentAudio.volume = e.target.value / 100;
                }
            });
        } catch (error) {
            console.error('Error in setupAudioControls:', error);
        }
    }

    previewAudio(audio, previewBtn) {
        try {
            if (this.currentAudio && this.currentAudio !== audio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                document.querySelectorAll('.preview-btn').forEach(btn => btn.textContent = 'Preview');
            }

            if (audio.paused) {
                audio.volume = 0.5;
                audio.play()
                    .then(() => {
                        previewBtn.textContent = 'Stop';
                        this.currentAudio = audio;
                    })
                    .catch(error => {
                        console.error('Audio preview failed:', error);
                        previewBtn.textContent = 'Error';
                    });
            } else {
                audio.pause();
                audio.currentTime = 0;
                previewBtn.textContent = 'Preview';
                this.currentAudio = null;
            }
        } catch (error) {
            console.error('Error in previewAudio:', error);
        }
    }

    startLoading() {
        try {
            const loadingAnimation = document.getElementById('loading-animation');
            if (!loadingAnimation) {
                console.error('Loading animation not found');
                return;
            }

            loadingAnimation.classList.add('active');
            const progress = loadingAnimation.querySelector('.progress');
            let width = 0;

            // Setup background video if selected
            if (this.selectedVideo && this.selectedVideo !== 'none') {
                const bgVideo = document.getElementById('bg-video');
                if (bgVideo) {
                    bgVideo.src = `videos/${this.selectedVideo}.mp4`;
                    bgVideo.play().catch(err => console.error('Background video failed to play:', err));
                }
            }

            // Setup selected background music
            if (this.selectedAudioTrack && this.selectedAudioTrack !== 'none') {
                const audio = new Audio(`audio/${this.selectedAudioTrack}.mp3`);
                audio.loop = true;
                audio.volume = 0.5;
                this.currentAudio = audio;
                audio.play().catch(err => console.error('Background audio failed to play:', err));
                
                const audioControls = document.getElementById('audio-controls');
                if (audioControls) audioControls.classList.remove('hidden');
            }

            // Simulate loading progress
            const interval = setInterval(() => {
                if (width >= 100) {
                    clearInterval(interval);
                    this.finishLoading();
                } else {
                    width += 2;
                    if (progress) progress.style.width = width + '%';
                }
            }, 50);
        } catch (error) {
            console.error('Error in startLoading:', error);
        }
    }

    finishLoading() {
        try {
            // Hide the loading interface but keep video container visible
            const loadingInterface = document.getElementById('loading-interface');
            const bgVideoContainer = document.getElementById('bg-video-container');
            const terminal = document.getElementById('terminal-container');
            
            if (loadingInterface) {
                // Move the video container out of the loading interface before hiding it
                if (bgVideoContainer && this.selectedVideo !== 'none') {
                    document.body.appendChild(bgVideoContainer);
                    const bgVideo = document.getElementById('bg-video');
                    if (bgVideo) {
                        bgVideo.style.display = 'block';
                        bgVideo.play().catch(err => console.error('Background video failed to play:', err));
                    }
                }
                loadingInterface.classList.remove('active');
            }
            
            // Show terminal and initialize app
            if (terminal) {
                terminal.classList.remove('hidden');
                terminal.style.backgroundColor = this.selectedVideo === 'none' ? 
                    'rgba(0, 0, 0, 1)' : 'rgba(0, 0, 0, 0.8)';
                    
                // Initialize the main app only after loading is complete
                import('./app.js').then(module => {
                    const output = document.getElementById("output");
                    const input = document.getElementById("input");
                    if (output && input) {
                        new module.TerminalStory();
                    }
                });
            }
            
            // Show audio controls if needed
            if (this.selectedAudioTrack !== 'none') {
                const audioControls = document.getElementById('audio-controls');
                if (audioControls) audioControls.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error in finishLoading:', error);
        }
    }
}

// Initialize only the loading interface
window.loadingInterface = new LoadingInterface();