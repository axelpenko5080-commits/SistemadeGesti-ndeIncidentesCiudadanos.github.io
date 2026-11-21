/* ============================================================
   SISTEMA DE GESTIÓN DE INCIDENTES CIUDADANOS
   Puente Piedra | Lima Metropolitana | Perú
   Prototipo UCV 2026
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================
    const CONFIG = {
        // Puente Piedra center coordinates (approximate center of district)
        districtCenter: [-11.8625, -77.0742],
        defaultZoom: 13,
        minZoom: 11,
        maxZoom: 18,
        districtName: 'Puente Piedra',
        // Puente Piedra approximate boundary polygon (from OpenStreetMap data)
        // These coordinates trace the actual district boundary
        districtBoundary: [
            [-11.8138, -77.1060],
            [-11.8098, -77.0952],
            [-11.8070, -77.0870],
            [-11.8105, -77.0790],
            [-11.8150, -77.0710],
            [-11.8175, -77.0635],
            [-11.8215, -77.0558],
            [-11.8275, -77.0510],
            [-11.8340, -77.0470],
            [-11.8405, -77.0435],
            [-11.8470, -77.0405],
            [-11.8530, -77.0385],
            [-11.8590, -77.0372],
            [-11.8650, -77.0365],
            [-11.8720, -77.0360],
            [-11.8790, -77.0365],
            [-11.8855, -77.0380],
            [-11.8915, -77.0400],
            [-11.8975, -77.0430],
            [-11.9025, -77.0470],
            [-11.9070, -77.0520],
            [-11.9105, -77.0580],
            [-11.9125, -77.0640],
            [-11.9130, -77.0710],
            [-11.9120, -77.0785],
            [-11.9095, -77.0855],
            [-11.9060, -77.0920],
            [-11.9010, -77.0975],
            [-11.8950, -77.1020],
            [-11.8880, -77.1050],
            [-11.8800, -77.1070],
            [-11.8720, -77.1080],
            [-11.8640, -77.1078],
            [-11.8560, -77.1070],
            [-11.8480, -77.1065],
            [-11.8400, -77.1065],
            [-11.8320, -77.1068],
            [-11.8240, -77.1070],
            [-11.8180, -77.1068],
            [-11.8138, -77.1060]
        ],
        // Territorial zones - based on commonly referenced areas of Puente Piedra
        // Note: These are approximate reference zones, not official municipal divisions
        zones: [
            {
                name: 'Cercado de Puente Piedra',
                description: 'Zona central del distrito',
                approxCenter: [-11.8625, -77.0742]
            },
            {
                name: 'Shangrila',
                description: 'Urbanización Shangrila',
                approxCenter: [-11.8730, -77.0780]
            },
            {
                name: 'Laderas de Chillón',
                description: 'Zona sur del distrito',
                approxCenter: [-11.8900, -77.0650]
            },
            {
                name: 'La Ensenada',
                description: 'Zona norte',
                approxCenter: [-11.8450, -77.0680]
            },
            {
                name: 'Lomas de Zapallal',
                description: 'Zona oeste del distrito',
                approxCenter: [-11.8550, -77.0900]
            },
            {
                name: 'Zapallal',
                description: 'Zona noroeste del distrito',
                approxCenter: [-11.8380, -77.0850]
            },
            {
                name: 'Tambo Inga',
                description: 'Zona sur del distrito',
                approxCenter: [-11.8800, -77.0500]
            },
            {
                name: 'Las Vegas',
                description: 'Zona central-sur',
                approxCenter: [-11.8700, -77.0650]
            }
        ],
        categories: {
            robbery: { label: 'Robos y Asaltos', color: '#ef4444', icon: '🔒' },
            accident: { label: 'Accidentes de Tránsito', color: '#f59e0b', icon: '⚡' },
            trash: { label: 'Acumulación de Basura', color: '#10b981', icon: '🗑️' }
        },
        statuses: {
            pending: { label: 'Pendiente', color: '#f59e0b', cssClass: 'status-pending' },
            progress: { label: 'En Proceso', color: '#3b82f6', cssClass: 'status-progress' },
            resolved: { label: 'Resuelto', color: '#10b981', cssClass: 'status-resolved' }
        }
    };

    // ============================================================
    // STATE
    // ============================================================
    const state = {
        incidents: [],
        currentSection: 'home',
        currentRole: 'citizen',
        maps: {},
        heatLayer: null,
        districtPolygon: null,
        markers: [],
        charts: {},
        reportMarker: null,
        reportLatLng: null,
        themePreference: localStorage.getItem('theme-preference') || 'auto',
        fontSize: parseInt(localStorage.getItem('font-size') || '100'),
        highContrast: localStorage.getItem('high-contrast') === 'true',
        reduceMotion: localStorage.getItem('reduce-motion') === 'true'
    };

    // ============================================================
    // SIMULATED DATA GENERATOR
    // ============================================================
    function generateSimulatedData() {
        const incidents = [];
        const descriptions = {
            robbery: [
                'Robo de celular a transeúnte en la vía pública',
                'Asalto a pasajero de transporte público',
                'Robo de cartera a señora cerca del mercado',
                'Intento de robo a local comercial',
                'Asalto con arma blanca a peatón',
                'Robo de bicicleta en estacionamiento',
                'Arrebato de bolso en paradero de buses',
                'Robo a repartidor de delivery',
                'Asalto a bodega en horario nocturno',
                'Robo de autopartes en vía pública'
            ],
            accident: [
                'Choque entre mototaxi y automóvil particular',
                'Atropello de peatón en cruce peatonal',
                'Volcadura de camión de carga',
                'Colisión múltiple en intersección',
                'Accidente de mototaxi por exceso de velocidad',
                'Choque de combi con poste de alumbrado',
                'Caída de ciclista por bache en la pista',
                'Choque lateral entre dos vehículos',
                'Accidente de tránsito con daños materiales',
                'Atropello en zona sin semáforo'
            ],
            trash: [
                'Acumulación de residuos en esquina del parque',
                'Basura acumulada frente a lote baldío',
                'Desechos de construcción en la vía pública',
                'Acumulación de basura en canal de riego',
                'Residuos orgánicos en paradero de buses',
                'Basura en berma central de avenida',
                'Acumulación de desmonte en terreno vacío',
                'Residuos domésticos arrojados en la calle',
                'Basura acumulada junto a contenedor lleno',
                'Desechos en área verde del parque'
            ]
        };

        const addresses = [
            'Av. Puente Piedra cdra. 5',
            'Jr. Bolívar cdra. 3',
            'Av. San Lorenzo cdra. 12',
            'Ca. Los Jazmines cdra. 2',
            'Av. Buenos Aires cdra. 8',
            'Jr. Túpac Amaru cdra. 6',
            'Av. Las Américas cdra. 15',
            'Ca. Los Olivos cdra. 4',
            'Av. Juan Lecaros cdra. 10',
            'Jr. Progreso cdra. 7',
            'Av. Panamericana Norte km 32',
            'Av. Panamericana Norte km 34',
            'Ca. San Martín cdra. 3',
            'Jr. Grau cdra. 5',
            'Av. Lecaros cdra. 9',
            'Ca. Los Claveles cdra. 1',
            'Av. San Juan cdra. 6',
            'Jr. Lima cdra. 4',
            'Ca. Las Palmeras cdra. 8',
            'Av. Industrial cdra. 11'
        ];

        const catKeys = ['robbery', 'accident', 'trash'];
        const statusKeys = ['pending', 'progress', 'resolved'];
        const now = new Date();

        for (let i = 0; i < 60; i++) {
            const cat = catKeys[Math.floor(Math.random() * catKeys.length)];
            const status = statusKeys[Math.floor(Math.random() * statusKeys.length)];
            const daysAgo = Math.floor(Math.random() * 90);
            const date = new Date(now);
            date.setDate(date.getDate() - daysAgo);
            const hour = Math.floor(Math.random() * 24);
            const minute = Math.floor(Math.random() * 60);
            date.setHours(hour, minute, 0, 0);

            // Generate point within district boundary
            const point = generatePointInDistrict();
            const zone = findNearestZone(point);

            incidents.push({
                id: `PP-2026-${String(i + 1).padStart(4, '0')}`,
                category: cat,
                description: descriptions[cat][Math.floor(Math.random() * descriptions[cat].length)],
                date: date.toISOString(),
                lat: point[0],
                lng: point[1],
                address: addresses[Math.floor(Math.random() * addresses.length)],
                zone: zone.name,
                status: status,
                reporter: Math.random() > 0.5 ? 'Anónimo' : `Ciudadano ${i + 1}`,
                isSimulated: true,
                history: generateHistory(date, status)
            });
        }

        return incidents.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function generatePointInDistrict() {
        const bounds = CONFIG.districtBoundary;
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        bounds.forEach(([lat, lng]) => {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });

        let attempts = 0;
        while (attempts < 100) {
            const lat = minLat + Math.random() * (maxLat - minLat);
            const lng = minLng + Math.random() * (maxLng - minLng);
            if (isPointInPolygon([lat, lng], bounds)) {
                return [lat, lng];
            }
            attempts++;
        }
        // Fallback to center area
        return [
            CONFIG.districtCenter[0] + (Math.random() - 0.5) * 0.02,
            CONFIG.districtCenter[1] + (Math.random() - 0.5) * 0.02
        ];
    }

    function isPointInPolygon(point, polygon) {
        const [y, x] = point;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [yi, xi] = polygon[i];
            const [yj, xj] = polygon[j];
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    function findNearestZone(point) {
        let nearest = CONFIG.zones[0];
        let minDist = Infinity;
        CONFIG.zones.forEach(zone => {
            const d = Math.sqrt(
                Math.pow(point[0] - zone.approxCenter[0], 2) +
                Math.pow(point[1] - zone.approxCenter[1], 2)
            );
            if (d < minDist) {
                minDist = d;
                nearest = zone;
            }
        });
        return nearest;
    }

    function generateHistory(date, status) {
        const history = [
            { date: date.toISOString(), status: 'pending', note: 'Incidente registrado en el sistema' }
        ];
        if (status === 'progress' || status === 'resolved') {
            const d2 = new Date(date);
            d2.setHours(d2.getHours() + Math.floor(Math.random() * 48) + 2);
            history.push({ date: d2.toISOString(), status: 'progress', note: 'Incidente en proceso de atención' });
        }
        if (status === 'resolved') {
            const d3 = new Date(date);
            d3.setDate(d3.getDate() + Math.floor(Math.random() * 7) + 1);
            history.push({ date: d3.toISOString(), status: 'resolved', note: 'Incidente resuelto y cerrado' });
        }
        return history;
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================
    function init() {
        // Load persisted data or generate
        const saved = localStorage.getItem('pp-incidents');
        if (saved) {
            try { state.incidents = JSON.parse(saved); } catch (e) { state.incidents = generateSimulatedData(); }
        } else {
            state.incidents = generateSimulatedData();
            localStorage.setItem('pp-incidents', JSON.stringify(state.incidents));
        }

        // Apply saved preferences
        applyTheme(state.themePreference);
        applyFontSize(state.fontSize);
        if (state.highContrast) document.documentElement.setAttribute('data-high-contrast', 'true');
        if (state.reduceMotion) document.documentElement.setAttribute('data-reduce-motion', 'true');

        // Setup UI
        setupNavigation();
        setupSidebar();
        setupThemeToggle();
        setupAccessibilityPanel();
        setupRoleSwitch();
        populateZoneFilters();
        updateHomeStats();
        renderRecentIncidents();
        setupReportForm();
        setupTrackSection();

        // Set default date values
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incident-date').value = today;
        document.getElementById('incident-date').max = today;

        // Hide loading
        setTimeout(() => {
            const ls = document.getElementById('loading-screen');
            ls.classList.add('hidden');
            setTimeout(() => ls.remove(), 600);
        }, 800);
    }

    // ============================================================
    // NAVIGATION
    // ============================================================
    function setupNavigation() {
        // Sidebar links
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                navigateTo(section);
                closeSidebar();
            });
        });

        // Hero action buttons
        document.querySelectorAll('[data-navigate]').forEach(btn => {
            btn.addEventListener('click', () => {
                navigateTo(btn.dataset.navigate);
            });
        });
    }

    function navigateTo(section) {
        // Update sections
        document.querySelectorAll('.section').forEach(s => {
            s.classList.remove('active');
            s.hidden = true;
        });
        const target = document.getElementById(`section-${section}`);
        if (target) {
            target.hidden = false;
            // Force reflow for animation
            target.offsetHeight;
            target.classList.add('active');
        }

        // Update sidebar active
        document.querySelectorAll('.sidebar-link').forEach(l => {
            l.classList.remove('active');
            l.removeAttribute('aria-current');
        });
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            activeLink.setAttribute('aria-current', 'page');
        }

        state.currentSection = section;

        // Initialize maps lazily
        if (section === 'map') initMainMap();
        if (section === 'report') initReportMap();
        if (section === 'dashboard') initDashboard();
        if (section === 'heatmap') initHeatmap();

        // Scroll to top
        window.scrollTo(0, 0);

        // Show/hide operator panel based on role
        if (section === 'track') {
            const opPanel = document.getElementById('operator-panel');
            if (state.currentRole === 'operator') {
                opPanel.hidden = false;
                renderOperatorList();
            } else {
                opPanel.hidden = true;
            }
        }

        // Announce navigation for screen readers
        announceStatus(`Navegando a ${section === 'home' ? 'inicio' : section}`);
    }

    // ============================================================
    // SIDEBAR
    // ============================================================
    function setupSidebar() {
        const toggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        toggle.addEventListener('click', () => {
            const isOpen = sidebar.getAttribute('aria-hidden') === 'false';
            if (isOpen) closeSidebar();
            else openSidebar();
        });

        overlay.addEventListener('click', closeSidebar);

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSidebar();
                closeAccessibilityPanel();
            }
        });
    }

    function openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggle = document.getElementById('menu-toggle');
        sidebar.setAttribute('aria-hidden', 'false');
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
    }

    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggle = document.getElementById('menu-toggle');
        sidebar.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
    }

    // ============================================================
    // THEME
    // ============================================================
    function setupThemeToggle() {
        const btn = document.getElementById('theme-toggle');
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            applyTheme(next);
            state.themePreference = next;
            localStorage.setItem('theme-preference', next);
            updateThemeRadios(next);
        });
    }

    function applyTheme(pref) {
        let theme = pref;
        if (pref === 'auto') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        // Update chart colors if charts exist
        updateChartColors();
    }

    function updateThemeRadios(value) {
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.setAttribute('aria-checked', opt.dataset.themeValue === value ? 'true' : 'false');
        });
    }

    // Listen for OS theme change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.themePreference === 'auto') {
            applyTheme('auto');
        }
    });

    // ============================================================
    // ACCESSIBILITY PANEL
    // ============================================================
    function setupAccessibilityPanel() {
        const toggle = document.getElementById('accessibility-toggle');
        const panel = document.getElementById('accessibility-panel');
        const closeBtn = document.getElementById('close-a11y-panel');

        toggle.addEventListener('click', () => {
            const isOpen = panel.getAttribute('aria-hidden') === 'false';
            if (isOpen) closeAccessibilityPanel();
            else openAccessibilityPanel();
        });

        closeBtn.addEventListener('click', closeAccessibilityPanel);

        // Font size
        const fontRange = document.getElementById('font-size-range');
        fontRange.value = state.fontSize;
        document.getElementById('font-size-value').textContent = state.fontSize;
        fontRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('font-size-value').textContent = val;
            applyFontSize(val);
            state.fontSize = val;
            localStorage.setItem('font-size', val);
        });

        // High contrast
        const hcToggle = document.getElementById('high-contrast-toggle');
        if (state.highContrast) hcToggle.setAttribute('aria-checked', 'true');
        hcToggle.addEventListener('click', () => {
            const on = hcToggle.getAttribute('aria-checked') === 'true';
            hcToggle.setAttribute('aria-checked', (!on).toString());
            state.highContrast = !on;
            localStorage.setItem('high-contrast', !on);
            if (!on) document.documentElement.setAttribute('data-high-contrast', 'true');
            else document.documentElement.removeAttribute('data-high-contrast');
        });

        // Reduce motion
        const rmToggle = document.getElementById('reduce-motion-toggle');
        if (state.reduceMotion) rmToggle.setAttribute('aria-checked', 'true');
        rmToggle.addEventListener('click', () => {
            const on = rmToggle.getAttribute('aria-checked') === 'true';
            rmToggle.setAttribute('aria-checked', (!on).toString());
            state.reduceMotion = !on;
            localStorage.setItem('reduce-motion', !on);
            if (!on) document.documentElement.setAttribute('data-reduce-motion', 'true');
            else document.documentElement.removeAttribute('data-reduce-motion');
        });

        // Theme radios
        updateThemeRadios(state.themePreference);
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const val = opt.dataset.themeValue;
                applyTheme(val);
                state.themePreference = val;
                localStorage.setItem('theme-preference', val);
                updateThemeRadios(val);
            });
        });
    }

    function openAccessibilityPanel() {
        document.getElementById('accessibility-panel').setAttribute('aria-hidden', 'false');
    }
    function closeAccessibilityPanel() {
        document.getElementById('accessibility-panel').setAttribute('aria-hidden', 'true');
    }

    function applyFontSize(pct) {
        document.documentElement.style.fontSize = (16 * pct / 100) + 'px';
    }

    // ============================================================
    // ROLE SWITCH
    // ============================================================
    function setupRoleSwitch() {
        const sel = document.getElementById('role-select');
        sel.addEventListener('change', () => {
            state.currentRole = sel.value;
            document.getElementById('current-role-label').textContent =
                sel.value === 'citizen' ? 'Ciudadano' : 'Operador';

            // Show/hide operator panel
            const opPanel = document.getElementById('operator-panel');
            if (state.currentSection === 'track') {
                if (sel.value === 'operator') {
                    opPanel.hidden = false;
                    renderOperatorList();
                } else {
                    opPanel.hidden = true;
                }
            }

            showToast('info', 'Rol actualizado', `Ahora estás como ${sel.value === 'citizen' ? 'Ciudadano' : 'Operador'}`);
        });
    }

    // ============================================================
    // ZONE FILTERS
    // ============================================================
    function populateZoneFilters() {
        const selectors = ['map-zone-filter', 'dash-zone-filter'];
        selectors.forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            CONFIG.zones.forEach(z => {
                const opt = document.createElement('option');
                opt.value = z.name;
                opt.textContent = z.name;
                sel.appendChild(opt);
            });
        });
    }

    // ============================================================
    // HOME SECTION
    // ============================================================
    function updateHomeStats() {
        const total = state.incidents.length;
        const robberies = state.incidents.filter(i => i.category === 'robbery').length;
        const accidents = state.incidents.filter(i => i.category === 'accident').length;
        const trash = state.incidents.filter(i => i.category === 'trash').length;

        animateNumber('stat-total', total);
        animateNumber('stat-robberies', robberies);
        animateNumber('stat-accidents', accidents);
        animateNumber('stat-trash', trash);
    }

    function animateNumber(id, target) {
        const el = document.getElementById(id);
        if (!el) return;
        const duration = 800;
        const start = parseInt(el.textContent) || 0;
        const diff = target - start;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + diff * eased);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function renderRecentIncidents() {
        const container = document.getElementById('recent-incidents');
        const recent = state.incidents.slice(0, 8);
        container.innerHTML = recent.map(inc => `
            <div class="incident-item" role="listitem" tabindex="0" data-id="${inc.id}" 
                 aria-label="${CONFIG.categories[inc.category].label}: ${inc.description}">
                <span class="incident-cat-dot ${inc.category}" aria-hidden="true"></span>
                <div class="incident-info">
                    <strong>${CONFIG.categories[inc.category].label}</strong>
                    <small>${inc.description} — ${formatDate(inc.date)}</small>
                </div>
                <span class="incident-status-badge ${CONFIG.statuses[inc.status].cssClass}">
                    ${CONFIG.statuses[inc.status].label}
                </span>
            </div>
        `).join('');

        // Click to track
        container.querySelectorAll('.incident-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('track-code-input').value = item.dataset.id;
                navigateTo('track');
                searchIncident();
            });
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    // ============================================================
    // HERO BACKGROUND MAP (Mini decorative map)
    // ============================================================
    function initHeroMap() {
        if (state.maps.hero) return;
        try {
            const map = L.map('hero-bg-map', {
                center: CONFIG.districtCenter,
                zoom: 13,
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
                keyboard: false,
                attributionControl: false
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                opacity: 0.6
            }).addTo(map);

            // Add boundary
            L.polygon(CONFIG.districtBoundary, {
                color: '#0071e3',
                weight: 2,
                fillColor: '#0071e3',
                fillOpacity: 0.08,
                dashArray: '5, 5'
            }).addTo(map);

            state.maps.hero = map;
        } catch (e) {
            console.warn('Hero map initialization skipped:', e);
        }
    }

    // ============================================================
    // MAIN MAP
    // ============================================================
    function initMainMap() {
        if (state.maps.main) {
            state.maps.main.invalidateSize();
            return;
        }

        const map = L.map('main-map', {
            center: CONFIG.districtCenter,
            zoom: CONFIG.defaultZoom,
            minZoom: CONFIG.minZoom,
            maxZoom: CONFIG.maxZoom
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Puente Piedra, Lima'
        }).addTo(map);

        // District boundary
        const boundary = L.polygon(CONFIG.districtBoundary, {
            color: '#0071e3',
            weight: 3,
            fillColor: '#0071e3',
            fillOpacity: 0.05,
            dashArray: '8, 4'
        }).addTo(map);

        boundary.bindPopup(`
            <div class="popup-title">Distrito de Puente Piedra</div>
            <div class="popup-detail">Lima Metropolitana, Perú</div>
            <div class="popup-detail">Límite territorial aproximado</div>
            <div class="popup-detail" style="color: var(--color-warning); margin-top: 4px;">
                Fuente: OpenStreetMap — Verificación pendiente con datos oficiales INEI
            </div>
        `);

        state.maps.main = map;
        state.districtPolygon = boundary;

        // Add markers for all incidents
        updateMapMarkers();

        // Setup map filters
        setupMapFilters();
    }

    function updateMapMarkers(filteredIncidents) {
        const map = state.maps.main;
        if (!map) return;

        // Clear existing markers
        state.markers.forEach(m => map.removeLayer(m));
        state.markers = [];

        const incidents = filteredIncidents || state.incidents;
        incidents.forEach(inc => {
            const marker = createMarker(inc);
            marker.addTo(map);
            state.markers.push(marker);
        });

        document.getElementById('map-visible-count').textContent = incidents.length;
    }

    function createMarker(inc) {
        const catConfig = CONFIG.categories[inc.category];
        const statusConfig = CONFIG.statuses[inc.status];

        const icon = L.divIcon({
            className: 'custom-marker-wrapper',
            html: `<div class="custom-marker ${inc.category}-marker"><span class="custom-marker-inner">${catConfig.icon}</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        const marker = L.marker([inc.lat, inc.lng], { icon });
        marker.bindPopup(`
            <div class="popup-title">${catConfig.label}</div>
            <div class="popup-detail"><strong>Código:</strong> ${inc.id}</div>
            <div class="popup-detail"><strong>Descripción:</strong> ${inc.description}</div>
            <div class="popup-detail"><strong>Dirección:</strong> ${inc.address}</div>
            <div class="popup-detail"><strong>Zona:</strong> ${inc.zone}</div>
            <div class="popup-detail"><strong>Fecha:</strong> ${formatDate(inc.date)}</div>
            <div class="popup-detail"><strong>Estado:</strong> <span class="incident-status-badge ${statusConfig.cssClass}" style="font-size:11px;">${statusConfig.label}</span></div>
            ${inc.isSimulated ? '<div class="popup-detail" style="color:var(--color-warning); margin-top:4px;">📋 Dato simulado</div>' : ''}
        `);

        return marker;
    }

    function setupMapFilters() {
        document.getElementById('apply-map-filters').addEventListener('click', applyMapFilters);
        document.getElementById('clear-map-filters').addEventListener('click', () => {
            document.querySelectorAll('[data-filter-cat]').forEach(cb => cb.checked = true);
            document.getElementById('map-date-from').value = '';
            document.getElementById('map-date-to').value = '';
            document.getElementById('map-zone-filter').value = '';
            updateMapMarkers();
        });
    }

    function applyMapFilters() {
        const cats = [];
        document.querySelectorAll('[data-filter-cat]:checked').forEach(cb => cats.push(cb.dataset.filterCat));
        const from = document.getElementById('map-date-from').value;
        const to = document.getElementById('map-date-to').value;
        const zone = document.getElementById('map-zone-filter').value;

        let filtered = state.incidents.filter(inc => cats.includes(inc.category));
        if (from) filtered = filtered.filter(inc => inc.date >= from);
        if (to) filtered = filtered.filter(inc => inc.date <= to + 'T23:59:59');
        if (zone) filtered = filtered.filter(inc => inc.zone === zone);

        updateMapMarkers(filtered);
        announceStatus(`Mostrando ${filtered.length} incidentes en el mapa`);
    }

    // ============================================================
    // REPORT SECTION
    // ============================================================
    function initReportMap() {
        if (state.maps.report) {
            state.maps.report.invalidateSize();
            return;
        }

        const map = L.map('report-map', {
            center: CONFIG.districtCenter,
            zoom: CONFIG.defaultZoom,
            minZoom: CONFIG.minZoom,
            maxZoom: CONFIG.maxZoom
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap | Puente Piedra'
        }).addTo(map);

        // District boundary
        L.polygon(CONFIG.districtBoundary, {
            color: '#0071e3',
            weight: 2,
            fillColor: '#0071e3',
            fillOpacity: 0.05,
            dashArray: '5, 5'
        }).addTo(map);

        // Click to place marker
        map.on('click', (e) => {
            const latlng = e.latlng;
            const inside = isPointInPolygon([latlng.lat, latlng.lng], CONFIG.districtBoundary);

            if (!inside) {
                document.getElementById('outside-modal').hidden = false;
                return;
            }

            // Place / move marker
            if (state.reportMarker) {
                state.reportMarker.setLatLng(latlng);
            } else {
                state.reportMarker = L.marker(latlng, {
                    draggable: true
                }).addTo(map);

                state.reportMarker.on('dragend', () => {
                    const pos = state.reportMarker.getLatLng();
                    if (!isPointInPolygon([pos.lat, pos.lng], CONFIG.districtBoundary)) {
                        document.getElementById('outside-modal').hidden = false;
                        state.reportMarker.setLatLng(latlng); // revert
                    } else {
                        updateSelectedLocation(pos.lat, pos.lng);
                    }
                });
            }

            updateSelectedLocation(latlng.lat, latlng.lng);
        });

        state.maps.report = map;
    }

    function updateSelectedLocation(lat, lng) {
        state.reportLatLng = { lat, lng };
        const zone = findNearestZone([lat, lng]);
        const infoEl = document.getElementById('selected-location-info');
        infoEl.hidden = false;
        document.getElementById('selected-coords').textContent =
            `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} — Zona: ${zone.name}`;
        document.getElementById('selected-address-display').textContent = '';
        document.getElementById('location-error').textContent = '';
        document.getElementById('map-selection-hint').textContent = 'Ubicación seleccionada. Puede arrastrar el marcador para ajustar.';
    }

    function setupReportForm() {
        // Location method tabs
        document.querySelectorAll('.location-method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.location-method-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');

                document.querySelectorAll('.location-panel').forEach(p => p.hidden = true);
                const panel = document.getElementById(`panel-${btn.dataset.method}`);
                if (panel) panel.hidden = false;

                if (btn.dataset.method === 'map' && state.maps.report) {
                    state.maps.report.invalidateSize();
                }
            });
        });

        // GPS button
        document.getElementById('get-gps-btn').addEventListener('click', () => {
            const statusEl = document.getElementById('gps-status');
            if (!navigator.geolocation) {
                statusEl.textContent = 'La geolocalización no está disponible en este navegador.';
                return;
            }
            statusEl.textContent = 'Obteniendo ubicación...';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const inside = isPointInPolygon([latitude, longitude], CONFIG.districtBoundary);
                    if (inside) {
                        state.reportLatLng = { lat: latitude, lng: longitude };
                        statusEl.textContent = `Ubicación obtenida: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} — Dentro de Puente Piedra ✅`;
                        const infoEl = document.getElementById('selected-location-info');
                        infoEl.hidden = false;
                        const zone = findNearestZone([latitude, longitude]);
                        document.getElementById('selected-coords').textContent =
                            `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)} — Zona: ${zone.name}`;
                    } else {
                        statusEl.textContent = `Su ubicación (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) está fuera de Puente Piedra. Seleccione manualmente un punto dentro del distrito.`;
                        // Switch to map mode
                        document.querySelector('[data-method="map"]').click();
                    }
                },
                (err) => {
                    statusEl.textContent = `Error al obtener ubicación: ${err.message}`;
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });

        // Photo upload
        const photoInput = document.getElementById('incident-photo');
        const uploadArea = document.getElementById('photo-upload-area');
        uploadArea.addEventListener('click', () => photoInput.click());
        uploadArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); photoInput.click(); }
        });
        photoInput.addEventListener('change', handlePhotoUpload);

        // Form submission
        document.getElementById('incident-form').addEventListener('submit', handleFormSubmit);

        // Close modals
        document.getElementById('close-success-modal').addEventListener('click', () => {
            document.getElementById('success-modal').hidden = true;
        });
        document.getElementById('close-outside-modal').addEventListener('click', () => {
            document.getElementById('outside-modal').hidden = true;
        });

        // Copy tracking code
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            const code = document.getElementById('tracking-code-result').textContent;
            navigator.clipboard.writeText(code).then(() => {
                showToast('success', 'Copiado', 'Código de seguimiento copiado al portapapeles');
            }).catch(() => {
                showToast('info', 'Código', code);
            });
        });
    }

    function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'Archivo muy grande', 'El tamaño máximo es 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const preview = document.getElementById('photo-preview');
            preview.hidden = false;
            preview.innerHTML = `
                <img src="${ev.target.result}" alt="Vista previa de la evidencia fotográfica">
                <button type="button" class="glass-btn glass-btn-sm" onclick="this.parentElement.hidden=true; document.getElementById('incident-photo').value='';">Eliminar</button>
            `;
        };
        reader.readAsDataURL(file);
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        // Validate
        let valid = true;

        const category = document.getElementById('incident-category').value;
        const date = document.getElementById('incident-date').value;
        const time = document.getElementById('incident-time').value;
        const desc = document.getElementById('incident-desc').value;

        // Clear errors
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

        if (!category) {
            document.getElementById('category-error').textContent = 'Seleccione una categoría';
            valid = false;
        }
        if (!date) {
            document.getElementById('date-error').textContent = 'Ingrese la fecha del incidente';
            valid = false;
        }
        if (!time) {
            document.getElementById('time-error').textContent = 'Ingrese la hora aproximada';
            valid = false;
        }
        if (!desc.trim()) {
            document.getElementById('desc-error').textContent = 'Ingrese una descripción';
            valid = false;
        }

        // Check location
        const activeMethod = document.querySelector('.location-method-btn.active').dataset.method;
        let lat, lng, address = '', reference = '';

        if (activeMethod === 'address') {
            address = document.getElementById('incident-address').value;
            reference = document.getElementById('incident-reference').value;
            if (!address.trim()) {
                document.getElementById('location-error').textContent = 'Ingrese una dirección';
                valid = false;
            }
            // Use district center as approximate location for address-based reports
            lat = CONFIG.districtCenter[0] + (Math.random() - 0.5) * 0.015;
            lng = CONFIG.districtCenter[1] + (Math.random() - 0.5) * 0.015;
        } else {
            if (!state.reportLatLng) {
                document.getElementById('location-error').textContent = 'Seleccione una ubicación en el mapa o use GPS';
                const infoEl = document.getElementById('selected-location-info');
                infoEl.hidden = false;
                valid = false;
            } else {
                lat = state.reportLatLng.lat;
                lng = state.reportLatLng.lng;
            }
        }

        if (!valid) {
            showToast('error', 'Formulario incompleto', 'Complete todos los campos obligatorios');
            announceStatus('Error: complete todos los campos obligatorios');
            return;
        }

        // Create incident
        const id = `PP-2026-${String(state.incidents.length + 1).padStart(4, '0')}`;
        const dateTime = new Date(`${date}T${time}`);
        const zone = findNearestZone([lat, lng]);

        const incident = {
            id,
            category,
            description: desc,
            date: dateTime.toISOString(),
            lat,
            lng,
            address: address || `Coord: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            reference,
            zone: zone.name,
            status: 'pending',
            reporter: document.getElementById('reporter-name').value || 'Anónimo',
            contact: document.getElementById('reporter-contact').value || '',
            isSimulated: false,
            history: [{ date: new Date().toISOString(), status: 'pending', note: 'Incidente registrado en el sistema' }]
        };

        state.incidents.unshift(incident);
        localStorage.setItem('pp-incidents', JSON.stringify(state.incidents));

        // Show success
        document.getElementById('tracking-code-result').textContent = id;
        document.getElementById('success-modal').hidden = false;

        // Reset form
        e.target.reset();
        document.getElementById('incident-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('selected-location-info').hidden = true;
        document.getElementById('photo-preview').hidden = true;
        if (state.reportMarker && state.maps.report) {
            state.maps.report.removeLayer(state.reportMarker);
            state.reportMarker = null;
        }
        state.reportLatLng = null;
        document.getElementById('map-selection-hint').textContent = 'Haga clic en el mapa para seleccionar la ubicación del incidente.';

        // Update stats
        updateHomeStats();
        renderRecentIncidents();

        showToast('success', 'Reporte registrado', `Código: ${id}`);
        announceStatus(`Reporte registrado exitosamente. Código de seguimiento: ${id}`);
    }

    // ============================================================
    // TRACK SECTION
    // ============================================================
    function setupTrackSection() {
        document.getElementById('track-search-btn').addEventListener('click', searchIncident);
        document.getElementById('track-code-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') searchIncident();
        });
    }

    function searchIncident() {
        const code = document.getElementById('track-code-input').value.trim().toUpperCase();
        const resultEl = document.getElementById('track-result');
        const notFoundEl = document.getElementById('track-not-found');

        const incident = state.incidents.find(i => i.id === code);

        if (!incident) {
            resultEl.hidden = true;
            notFoundEl.hidden = false;
            announceStatus('No se encontró ningún reporte con ese código');
            return;
        }

        notFoundEl.hidden = true;
        resultEl.hidden = false;

        const catConfig = CONFIG.categories[incident.category];
        const statusConfig = CONFIG.statuses[incident.status];

        resultEl.innerHTML = `
            <div class="glass-card track-detail-card">
                <div class="section-header" style="margin-bottom: var(--space-md);">
                    <h3>${catConfig.label}</h3>
                    <span class="incident-status-badge ${statusConfig.cssClass}" style="margin-left: var(--space-sm);">${statusConfig.label}</span>
                    ${incident.isSimulated ? '<span class="glass-chip" style="color:var(--color-warning); margin-left:var(--space-sm);">Dato Simulado</span>' : ''}
                </div>
                <div class="track-detail-row"><span class="track-label">Código</span><span class="track-value">${incident.id}</span></div>
                <div class="track-detail-row"><span class="track-label">Categoría</span><span class="track-value">${catConfig.label}</span></div>
                <div class="track-detail-row"><span class="track-label">Descripción</span><span class="track-value">${incident.description}</span></div>
                <div class="track-detail-row"><span class="track-label">Fecha</span><span class="track-value">${formatDate(incident.date)}</span></div>
                <div class="track-detail-row"><span class="track-label">Dirección</span><span class="track-value">${incident.address}</span></div>
                <div class="track-detail-row"><span class="track-label">Zona</span><span class="track-value">${incident.zone}</span></div>
                <div class="track-detail-row"><span class="track-label">Reportante</span><span class="track-value">${incident.reporter}</span></div>
                <div class="track-detail-row"><span class="track-label">Estado</span><span class="track-value"><span class="incident-status-badge ${statusConfig.cssClass}">${statusConfig.label}</span></span></div>
                
                <div id="track-map-container" class="track-map" role="application" aria-label="Ubicación del incidente en el mapa"></div>
                
                <div class="track-history">
                    <h4 style="margin-bottom: var(--space-sm);">Historial</h4>
                    ${incident.history.map(h => `
                        <div class="history-item">
                            <span class="history-dot" style="background: ${CONFIG.statuses[h.status].color};"></span>
                            <div>
                                <div>${h.note}</div>
                                <div class="history-time">${formatDate(h.date)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Init track map
        setTimeout(() => {
            const container = document.getElementById('track-map-container');
            if (container && container._leaflet_id) return;
            const tmap = L.map('track-map-container', {
                center: [incident.lat, incident.lng],
                zoom: 16,
                zoomControl: true,
                dragging: true
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(tmap);
            L.marker([incident.lat, incident.lng]).addTo(tmap)
                .bindPopup(`${catConfig.label}<br>${incident.address}`).openPopup();

            L.polygon(CONFIG.districtBoundary, {
                color: '#0071e3', weight: 1, fillOpacity: 0.02, dashArray: '4, 4'
            }).addTo(tmap);
        }, 100);

        announceStatus(`Reporte encontrado: ${incident.id}, ${catConfig.label}, estado: ${statusConfig.label}`);
    }

    // ============================================================
    // OPERATOR PANEL
    // ============================================================
    function renderOperatorList() {
        const container = document.getElementById('operator-incidents-list');
        if (!container) return;

        container.innerHTML = state.incidents.slice(0, 20).map(inc => {
            const catConfig = CONFIG.categories[inc.category];
            const statusConfig = CONFIG.statuses[inc.status];
            return `
                <div class="operator-incident" role="listitem">
                    <div class="operator-incident-info">
                        <strong><span class="incident-cat-dot ${inc.category}" style="display:inline-block;width:8px;height:8px;border-radius:50;margin-right:6px;"></span> ${inc.id} — ${catConfig.label}</strong>
                        <small>${inc.description} | ${formatDate(inc.date)} | ${inc.zone}</small>
                    </div>
                    <div class="operator-actions" role="group" aria-label="Cambiar estado del incidente ${inc.id}">
                        <button class="operator-btn ${inc.status === 'pending' ? 'active-status' : ''}" data-id="${inc.id}" data-status="pending" aria-label="Marcar como pendiente">Pendiente</button>
                        <button class="operator-btn ${inc.status === 'progress' ? 'active-status' : ''}" data-id="${inc.id}" data-status="progress" aria-label="Marcar en proceso">En Proceso</button>
                        <button class="operator-btn ${inc.status === 'resolved' ? 'active-status' : ''}" data-id="${inc.id}" data-status="resolved" aria-label="Marcar como resuelto">Resuelto</button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.operator-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const newStatus = btn.dataset.status;
                const inc = state.incidents.find(i => i.id === id);
                if (inc) {
                    inc.status = newStatus;
                    inc.history.push({
                        date: new Date().toISOString(),
                        status: newStatus,
                        note: `Estado actualizado a: ${CONFIG.statuses[newStatus].label}`
                    });
                    localStorage.setItem('pp-incidents', JSON.stringify(state.incidents));
                    renderOperatorList();
                    updateHomeStats();
                    renderRecentIncidents();
                    showToast('success', 'Estado actualizado',
                        `${id} → ${CONFIG.statuses[newStatus].label}`);
                    announceStatus(`Estado del incidente ${id} actualizado a ${CONFIG.statuses[newStatus].label}`);
                }
            });
        });
    }

    // ============================================================
    // DASHBOARD
    // ============================================================
    function initDashboard() {
        updateDashboardStats();
        initCharts();

        // Setup filters
        document.getElementById('apply-dash-filters').addEventListener('click', () => {
            updateDashboardStats();
            updateCharts();
        });
        document.getElementById('clear-dash-filters').addEventListener('click', () => {
            document.getElementById('dash-cat-filter').value = '';
            document.getElementById('dash-zone-filter').value = '';
            document.getElementById('dash-date-from').value = '';
            document.getElementById('dash-date-to').value = '';
            updateDashboardStats();
            updateCharts();
        });

        // Dashboard map
        if (!state.maps.dashboard) {
            setTimeout(() => {
                const dmap = L.map('dashboard-map', {
                    center: CONFIG.districtCenter,
                    zoom: 13
                });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(dmap);
                L.polygon(CONFIG.districtBoundary, {
                    color: '#0071e3', weight: 2, fillOpacity: 0.03, dashArray: '5, 5'
                }).addTo(dmap);

                state.incidents.forEach(inc => {
                    createMarker(inc).addTo(dmap);
                });

                state.maps.dashboard = dmap;
            }, 200);
        } else {
            state.maps.dashboard.invalidateSize();
        }
    }

    function getFilteredDashboardData() {
        const cat = document.getElementById('dash-cat-filter').value;
        const zone = document.getElementById('dash-zone-filter').value;
        const from = document.getElementById('dash-date-from').value;
        const to = document.getElementById('dash-date-to').value;

        let data = [...state.incidents];
        if (cat) data = data.filter(i => i.category === cat);
        if (zone) data = data.filter(i => i.zone === zone);
        if (from) data = data.filter(i => i.date >= from);
        if (to) data = data.filter(i => i.date <= to + 'T23:59:59');
        return data;
    }

    function updateDashboardStats() {
        const data = getFilteredDashboardData();
        animateNumber('dash-total', data.length);
        animateNumber('dash-pending', data.filter(i => i.status === 'pending').length);
        animateNumber('dash-progress', data.filter(i => i.status === 'progress').length);
        animateNumber('dash-resolved', data.filter(i => i.status === 'resolved').length);
    }

    function getChartTextColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#666';
    }

    function getChartGridColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--glass-border-subtle').trim() || 'rgba(0,0,0,0.05)';
    }

    function initCharts() {
        if (state.charts.category) {
            updateCharts();
            return;
        }

        const data = getFilteredDashboardData();
        const textColor = getChartTextColor();
        const gridColor = getChartGridColor();

        // Category chart (Doughnut)
        const catCtx = document.getElementById('chart-category').getContext('2d');
        state.charts.category = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: ['Robos y Asaltos', 'Accidentes de Tránsito', 'Acumulación de Basura'],
                datasets: [{
                    data: [
                        data.filter(i => i.category === 'robbery').length,
                        data.filter(i => i.category === 'accident').length,
                        data.filter(i => i.category === 'trash').length
                    ],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, padding: 16, font: { size: 12 } } }
                },
                cutout: '65%'
            }
        });

        // Status chart (Doughnut)
        const statusCtx = document.getElementById('chart-status').getContext('2d');
        state.charts.status = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pendiente', 'En Proceso', 'Resuelto'],
                datasets: [{
                    data: [
                        data.filter(i => i.status === 'pending').length,
                        data.filter(i => i.status === 'progress').length,
                        data.filter(i => i.status === 'resolved').length
                    ],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, padding: 16, font: { size: 12 } } }
                },
                cutout: '65%'
            }
        });

        // Timeline chart (Line)
        const timeData = getTimelineData(data);
        const timeCtx = document.getElementById('chart-timeline').getContext('2d');
        state.charts.timeline = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: timeData.labels,
                datasets: [{
                    label: 'Incidentes',
                    data: timeData.values,
                    borderColor: '#0071e3',
                    backgroundColor: 'rgba(0, 113, 227, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#0071e3'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
                }
            }
        });

        // Zone chart (Bar)
        const zoneData = getZoneData(data);
        const zoneCtx = document.getElementById('chart-zone').getContext('2d');
        state.charts.zone = new Chart(zoneCtx, {
            type: 'bar',
            data: {
                labels: zoneData.labels,
                datasets: [{
                    label: 'Incidentes',
                    data: zoneData.values,
                    backgroundColor: 'rgba(0, 113, 227, 0.6)',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } }
                }
            }
        });

        // Hours chart (Bar)
        const hourData = getHourData(data);
        const hourCtx = document.getElementById('chart-hours').getContext('2d');
        state.charts.hours = new Chart(hourCtx, {
            type: 'bar',
            data: {
                labels: hourData.labels,
                datasets: [{
                    label: 'Incidentes',
                    data: hourData.values,
                    backgroundColor: 'rgba(94, 92, 230, 0.6)',
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } }
                }
            }
        });
    }

    function updateCharts() {
        const data = getFilteredDashboardData();
        const textColor = getChartTextColor();
        const gridColor = getChartGridColor();

        if (state.charts.category) {
            state.charts.category.data.datasets[0].data = [
                data.filter(i => i.category === 'robbery').length,
                data.filter(i => i.category === 'accident').length,
                data.filter(i => i.category === 'trash').length
            ];
            state.charts.category.options.plugins.legend.labels.color = textColor;
            state.charts.category.update();
        }

        if (state.charts.status) {
            state.charts.status.data.datasets[0].data = [
                data.filter(i => i.status === 'pending').length,
                data.filter(i => i.status === 'progress').length,
                data.filter(i => i.status === 'resolved').length
            ];
            state.charts.status.options.plugins.legend.labels.color = textColor;
            state.charts.status.update();
        }

        if (state.charts.timeline) {
            const timeData = getTimelineData(data);
            state.charts.timeline.data.labels = timeData.labels;
            state.charts.timeline.data.datasets[0].data = timeData.values;
            state.charts.timeline.options.scales.x.ticks.color = textColor;
            state.charts.timeline.options.scales.y.ticks.color = textColor;
            state.charts.timeline.options.scales.x.grid.color = gridColor;
            state.charts.timeline.options.scales.y.grid.color = gridColor;
            state.charts.timeline.update();
        }

        if (state.charts.zone) {
            const zoneData = getZoneData(data);
            state.charts.zone.data.labels = zoneData.labels;
            state.charts.zone.data.datasets[0].data = zoneData.values;
            state.charts.zone.options.scales.x.ticks.color = textColor;
            state.charts.zone.options.scales.y.ticks.color = textColor;
            state.charts.zone.options.scales.x.grid.color = gridColor;
            state.charts.zone.update();
        }

        if (state.charts.hours) {
            const hourData = getHourData(data);
            state.charts.hours.data.datasets[0].data = hourData.values;
            state.charts.hours.options.scales.x.ticks.color = textColor;
            state.charts.hours.options.scales.y.ticks.color = textColor;
            state.charts.hours.options.scales.y.grid.color = gridColor;
            state.charts.hours.update();
        }
    }

    function updateChartColors() {
        if (Object.keys(state.charts).length > 0) {
            setTimeout(updateCharts, 100);
        }
    }

    function getTimelineData(data) {
        const months = {};
        data.forEach(inc => {
            const d = new Date(inc.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months[key] = (months[key] || 0) + 1;
        });
        const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
        return {
            labels: sorted.map(([k]) => {
                const [y, m] = k.split('-');
                const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return `${names[parseInt(m) - 1]} ${y}`;
            }),
            values: sorted.map(([, v]) => v)
        };
    }

    function getZoneData(data) {
        const zones = {};
        data.forEach(inc => { zones[inc.zone] = (zones[inc.zone] || 0) + 1; });
        const sorted = Object.entries(zones).sort((a, b) => b[1] - a[1]);
        return { labels: sorted.map(([k]) => k), values: sorted.map(([, v]) => v) };
    }

    function getHourData(data) {
        const hours = new Array(24).fill(0);
        data.forEach(inc => {
            const h = new Date(inc.date).getHours();
            hours[h]++;
        });
        return {
            labels: hours.map((_, i) => `${String(i).padStart(2, '0')}:00`),
            values: hours
        };
    }

    // ============================================================
    // HEATMAP
    // ============================================================
    function initHeatmap() {
        if (state.maps.heatmap) {
            state.maps.heatmap.invalidateSize();
            updateHeatLayer();
            return;
        }

        const map = L.map('heatmap-map', {
            center: CONFIG.districtCenter,
            zoom: CONFIG.defaultZoom,
            minZoom: CONFIG.minZoom,
            maxZoom: CONFIG.maxZoom
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap | Puente Piedra — Mapa de Calor (Datos Simulados)'
        }).addTo(map);

        // District boundary
        L.polygon(CONFIG.districtBoundary, {
            color: '#0071e3',
            weight: 2,
            fillColor: '#0071e3',
            fillOpacity: 0.03,
            dashArray: '5, 5'
        }).addTo(map);

        state.maps.heatmap = map;
        updateHeatLayer();

        // Setup controls
        const intensityRange = document.getElementById('heat-intensity');
        const opacityRange = document.getElementById('heat-opacity');

        intensityRange.addEventListener('input', (e) => {
            document.getElementById('heat-intensity-value').textContent = e.target.value;
        });
        opacityRange.addEventListener('input', (e) => {
            document.getElementById('heat-opacity-value').textContent = e.target.value + '%';
        });

        document.getElementById('apply-heat-filters').addEventListener('click', updateHeatLayer);

        // Checkbox changes
        ['heat-robbery', 'heat-accident', 'heat-trash'].forEach(id => {
            document.getElementById(id).addEventListener('change', updateHeatLayer);
        });
    }

    function updateHeatLayer() {
        const map = state.maps.heatmap;
        if (!map) return;

        // Remove existing
        if (state.heatLayer) {
            map.removeLayer(state.heatLayer);
        }

        // Filter data
        const showRobbery = document.getElementById('heat-robbery').checked;
        const showAccident = document.getElementById('heat-accident').checked;
        const showTrash = document.getElementById('heat-trash').checked;
        const from = document.getElementById('heat-date-from').value;
        const to = document.getElementById('heat-date-to').value;

        let filtered = state.incidents.filter(inc => {
            if (inc.category === 'robbery' && !showRobbery) return false;
            if (inc.category === 'accident' && !showAccident) return false;
            if (inc.category === 'trash' && !showTrash) return false;
            if (from && inc.date < from) return false;
            if (to && inc.date > to + 'T23:59:59') return false;
            return true;
        });

        const intensity = parseInt(document.getElementById('heat-intensity').value) || 20;
        const opacity = (parseInt(document.getElementById('heat-opacity').value) || 65) / 100;

        const points = filtered.map(inc => [inc.lat, inc.lng, 0.5]);

        if (typeof L.heatLayer === 'function') {
            state.heatLayer = L.heatLayer(points, {
                radius: intensity,
                blur: intensity * 0.8,
                maxZoom: 17,
                max: 1.0,
                minOpacity: opacity * 0.3,
                gradient: {
                    0.2: '#0071e3',
                    0.4: '#00b4d8',
                    0.6: '#f59e0b',
                    0.8: '#ef4444',
                    1.0: '#dc2626'
                }
            }).addTo(map);
        }

        document.getElementById('heat-total-count').textContent = filtered.length;
    }

    // ============================================================
    // UTILITIES
    // ============================================================
    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-PE', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function showToast(type, title, message) {
        const container = document.getElementById('toast-container');
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.innerHTML = `
            <span class="toast-icon" aria-hidden="true">${icons[type] || 'ℹ️'}</span>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Cerrar notificación">✕</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        });

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    function announceStatus(message) {
        // WCAG 4.1.3 - Status Messages
        const announcer = document.createElement('div');
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
        announcer.textContent = message;
        document.body.appendChild(announcer);
        setTimeout(() => announcer.remove(), 3000);
    }

    // ============================================================
    // INIT ON DOM READY
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            // Init hero map after a delay
            setTimeout(initHeroMap, 1200);
        });
    } else {
        init();
        setTimeout(initHeroMap, 1200);
    }
})();
