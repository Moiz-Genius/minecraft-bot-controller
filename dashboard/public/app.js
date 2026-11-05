/**
 * MOIZ DASHBOARD V2.0
 * Modular Class-Based Architecture
 */

class DashboardApp {
    constructor() {
        this.socket = io();
        this.nav = new NavigationController();
        this.bots = new BotModule(this.socket);
        this.ops = new OperationModule(this.socket);
        this.proxy = new ProxyModule(this.socket);
        this.relay = new RelayModule(this.socket);
        this.plugins = new PluginModule(this.socket);
        this.logger = new LogModule(this.socket);


        this.init();
        this.initTooltips();
        this.renderThemes();
        this.loadTheme();
    }

    loadTheme() {
        const saved = localStorage.getItem('moiz-theme') || 'neon';
        this.setTheme(saved);
    }

    renderThemes() {
        const grid = document.getElementById('theme-grid');
        if (!grid) return;

        const themes = [
            { id: 'neon', name: 'NEON GENESIS', c1: '#00f3ff', c2: '#bc13fe' },
            { id: 'king', name: 'KINGS DOMAIN', c1: '#FFD700', c2: '#800080' },
            { id: 'shadow', name: 'SHADOW OPS', c1: '#95A5A6', c2: '#2C3E50' },
            { id: 'matrix', name: 'MATRIX CORE', c1: '#00FF00', c2: '#006400' },
            { id: 'crimson', name: 'CRIMSON FURY', c1: '#FF4500', c2: '#8B0000' },
            { id: 'ocean', name: 'OCEANIC DRIFT', c1: '#00BFFF', c2: '#1E90FF' },
            { id: 'retro', name: 'RETRO SYNTH', c1: '#00FFFF', c2: '#FF00FF' },
            { id: 'glitch', name: 'SPECTRAL GLITCH', c1: '#FFFFFF', c2: '#FF0000' },
            { id: 'solar', name: 'SOLAR FLARE', c1: '#FFA500', c2: '#FFFF00' },
            { id: 'void', name: 'VOID WALKER', c1: '#4B0082', c2: '#000000' }
        ];

        grid.innerHTML = '';
        themes.forEach(t => {
            const card = document.createElement('div');
            card.className = 'theme-card';
            card.dataset.theme = t.id;
            card.onclick = () => this.setTheme(t.id);

            card.innerHTML = `
                <div class="theme-preview" style="background: linear-gradient(135deg, ${t.c1} 0%, ${t.c2} 100%);">
                    <div class="theme-preview-overlay" style="background:${t.c2}; opacity:0.3;"></div>
                </div>
                <div class="theme-name" style="color:${t.c1}; text-shadow:0 0 5px ${t.c1}44;">${t.name}</div>
            `;
            grid.appendChild(card);
        });
    }

    setTheme(themeName) {
        const link = document.getElementById('theme-style');
        if (link) {
            link.href = `themes/${themeName}.css`;
            localStorage.setItem('moiz-theme', themeName);

            // Update active state in visual grid
            document.querySelectorAll('.theme-card').forEach(c => {
                c.classList.remove('active');
                if (c.dataset.theme === themeName) c.classList.add('active');
            });
        }
    }

    init() {
        console.log('[SYSTEM] Dashboard Initialized');

        // Global Socket Events
        this.socket.on('connect', () => {
            document.getElementById('sys-status').className = 'status-pill online';
            document.getElementById('sys-status').textContent = 'SYSTEM ONLINE';
            this.logger.add('info', 'Connected to Command Server.');

            // Initial Data Fetch
            this.socket.emit('requestBlockList');
            this.proxy.refresh();
        });

        this.socket.on('disconnect', () => {
            document.getElementById('sys-status').className = 'status-pill offline';
            document.getElementById('sys-status').textContent = 'CONNECTION LOST';
            this.logger.add('error', 'Connection to server lost.');
        });
    }

    // Helper to emit commands globally
    emitCmd(action, args = {}) {
        // Resolve Input IDs if passed
        const resolvedArgs = {};
        for (const [key, val] of Object.entries(args)) {
            if (typeof val === 'string' && document.getElementById(val)) {
                resolvedArgs[key] = document.getElementById(val).value;
                if (key === 'input') resolvedArgs.message = resolvedArgs[key]; // Alias for chat
            } else {
                resolvedArgs[key] = val;
            }
        }

        // Determine targets
        let targets = Array.from(this.bots.selected);
        if (targets.length === 0) targets = ['all'];

        this.socket.emit('command', { action, targets, args: resolvedArgs });
        this.logger.add('info', `CMD: ${action} -> [${targets.length} Units]`);
    }

    emitControl(action, state) {
        // For manual movement (keydown/keyup)
        const targets = Array.from(this.bots.selected);
        this.socket.emit('command', { action: 'move', targets, args: { dir: action, state } });
    }

    initTooltips() {
        const tooltip = document.getElementById('global-tooltip');

        document.addEventListener('mouseover', (e) => {
            if (e.target && e.target.dataset && e.target.dataset.desc) {
                tooltip.textContent = e.target.dataset.desc;
                tooltip.style.opacity = '1';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (tooltip.style.opacity === '1') {
                const offset = 15;
                tooltip.style.left = (e.clientX + offset) + 'px';
                tooltip.style.top = (e.clientY + offset) + 'px';
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target && e.target.dataset && e.target.dataset.desc) {
                tooltip.style.opacity = '0';
            }
        });
    }
}

class NavigationController {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.sections = document.querySelectorAll('.view-section');

        this.navItems.forEach(item => {
            item.addEventListener('click', () => this.switchView(item));
        });
    }

    switchView(targetItem) {
        // Update Nav State
        this.navItems.forEach(n => n.classList.remove('active'));
        targetItem.classList.add('active');

        // Update View State
        const targetId = targetItem.getAttribute('data-target');
        this.sections.forEach(sec => {
            if (sec.id === targetId) sec.classList.add('active');
            else sec.classList.remove('active');
        });

        // Special Triggers
        if (targetId === 'view-map') {
            if (window.app && window.app.bots) window.app.bots.updateMapSelection();
        }
    }
}

class BotModule {
    constructor(socket) {
        this.socket = socket;
        this.list = [];
        this.selected = new Set();
        this.rosterEl = document.getElementById('bot-roster');
        this.countEl = document.getElementById('bot-count-bg');

        // UI Binds
        document.getElementById('select-all').addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        document.getElementById('btn-disconnect-sel').addEventListener('click', () => this.disconnectSelected());

        document.getElementById('btn-deploy').addEventListener('click', () => this.deploy());

        // Tab Nav
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active-tab'));
                btn.classList.add('active-tab');
                document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                document.getElementById(btn.getAttribute('data-tab')).style.display = 'block';
            });
        });

        // Socket Listeners
        // Socket Listeners
        this.socket.on('botListUpdate', (data) => this.updateList(data));

        // Chat & AI Listeners (FIXED)
        const btnChat = document.getElementById('btn-send-chat');
        if (btnChat) btnChat.addEventListener('click', () => {
            const input = document.getElementById('chat-input');
            if (input && input.value) {
                this.socket.emit('command', { action: 'say', targets: ['all'], args: { message: input.value } });
                input.value = '';
            }
        });

        const btnAI = document.getElementById('btn-send-ai');
        if (btnAI) btnAI.addEventListener('click', () => {
            const input = document.getElementById('ai-input');
            if (input && input.value) {
                this.socket.emit('command', { action: '!ai', targets: ['all'], args: { fullCommand: `!ai ${input.value}` } });
                // Log to chat
                this.logChat("COMMANDER", `Asking AI: ${input.value}`);
                input.value = '';
            }
        });

        // Chat Logger
        this.socket.on('log', (data) => {
            if (data.type === 'chat') {
                this.logChat('NET', data.message.replace('[CHAT] ', ''));
            }
        });

        // Profiles
        this.profiles = [];
        this.socket.on('profilesList', (data) => this.updateProfiles(data));
        document.getElementById('btn-load-profile').addEventListener('click', () => this.loadProfile());
        document.getElementById('btn-save-profile').addEventListener('click', () => this.saveProfile());
        document.getElementById('btn-del-profile').addEventListener('click', () => this.delProfile());
    }

    updateList(data) {
        this.list = data;
        this.countEl.textContent = `${data.length} UNITS`;
        this.rosterEl.innerHTML = '';

        if (data.length === 0) {
            this.rosterEl.innerHTML = '<div style="text-align:center; color:var(--text-dim); margin-top:50px;">NO UNITS DETECTED</div>';
            return;
        }

        data.forEach(bot => {
            const div = document.createElement('div');
            div.className = `bot-list-item ${this.selected.has(bot.username) ? 'selected' : ''}`;
            div.innerHTML = `
                <div class="flex flex-col w-full">
                    <div class="flex justify-between align-center">
                        <div style="font-weight:bold; color:var(--primary-cyan);">${bot.username}</div>
                        <div class="status-pill online" style="font-size:0.6rem; padding:2px 6px;">ONLINE</div>
                    </div>
                    <div class="flex justify-between align-center mt-20" style="margin-top:5px;">
                         <div style="font-size:0.7rem; color:var(--text-dim);">❤️ ${Math.round(bot.health)} 🍖 ${Math.round(bot.food)}</div>
                         <div style="font-size:0.6rem; color:#888;">${bot.host}:${bot.port}</div>
                    </div>
                </div>
            `;
            div.addEventListener('click', () => this.toggleSelection(bot.username));
            this.rosterEl.appendChild(div);
        });

        this.updateMapSelection();
        this.renderInventory();
    }

    logChat(user, msg) {
        const panel = document.getElementById('chat-history');
        if (panel) {
            const d = document.createElement('div');
            d.style.marginBottom = '5px';
            d.style.borderBottom = '1px solid #333';
            d.style.padding = '5px 0';
            d.innerHTML = `<span style="opacity:0.6; font-size:0.75rem;">[${new Date().toLocaleTimeString()}]</span> <span style="color:var(--primary-cyan); font-weight:bold;">${user}</span>: <span style="color:#fff;">${msg}</span>`;
            panel.appendChild(d);
            panel.scrollTop = panel.scrollHeight;
        }
    }

    toggleSelection(username) {
        if (this.selected.has(username)) this.selected.delete(username);
        else this.selected.add(username);
        this.updateList(this.list);
    }

    renderInventory() {
        // Redesigned to support Visualizer
        const grid = document.getElementById('inventory-grid');
        const ownerLabel = document.getElementById('inv-owner');
        const countLabel = document.getElementById('inv-count');
        const skinImg = document.getElementById('char-skin');
        const placeholder = document.getElementById('char-placeholder');
        const charHp = document.getElementById('char-hp');
        const charFood = document.getElementById('char-food');

        if (!grid) return;

        if (this.selected.size === 0) {
            ownerLabel.textContent = 'NO UNIT SELECTED';
            grid.innerHTML = '<div style="color:var(--text-dim); padding:20px; grid-column:1/-1; text-align:center;">Select a unit to inspect inventory.</div>';
            if (skinImg) skinImg.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
            this.clearEquipmentSlots();
            return;
        }

        // Target Strategy: Show last selected bot
        const targetUser = Array.from(this.selected).pop();
        const bot = this.list.find(b => b.username === targetUser);

        if (!bot) return;

        ownerLabel.textContent = `INVENTORY: ${bot.username}`;
        countLabel.textContent = `${(bot.inventory || []).length} ITEMS`;

        // Update Visualizer
        if (skinImg && placeholder) {
            skinImg.src = `https://minotar.net/armor/body/${bot.username}`;
            skinImg.style.display = 'block';
            placeholder.style.display = 'none';
        }

        if (charHp) charHp.textContent = Math.round(bot.health);
        if (charFood) charFood.textContent = Math.round(bot.food);

        // Render Equipment
        this.renderEquipmentSlot('slot-head', bot.equipment?.head);
        this.renderEquipmentSlot('slot-chest', bot.equipment?.chest);
        this.renderEquipmentSlot('slot-legs', bot.equipment?.legs);
        this.renderEquipmentSlot('slot-feet', bot.equipment?.feet);
        this.renderEquipmentSlot('slot-offhand', bot.equipment?.offhand);

        // Render Grid
        grid.innerHTML = '';
        const items = bot.inventory || [];

        if (items.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-dim); padding:20px; grid-column:1/-1; text-align:center;">Inventory Empty</div>';
        } else {
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'panel';
                div.style.padding = '5px';
                div.style.margin = '0';
                div.style.fontSize = '0.7rem';
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.alignItems = 'center';
                div.style.gap = '2px';
                div.style.cursor = 'pointer';
                div.style.background = 'rgba(0,0,0,0.4)';
                div.style.position = 'relative';

                const iconUrl = `https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.1/items/${item.name}.png`;

                div.innerHTML = `
                    <!-- IMG REMOVED -->
                    <div style="font-weight:bold; color:var(--primary-cyan); text-align:center; overflow:hidden; text-overflow:ellipsis; width:100%; white-space:nowrap;">${item.name}</div>
                    <div class="status-pill" style="font-size:0.6rem; padding:1px 4px;">${item.count}</div>
                    <div class="flex mt-20" style="gap:2px; margin-top:5px;">
                         <button class="cyber-btn" style="padding:1px 3px; font-size:0.6rem;" onclick="app.emitCmd('equip', {username:'${bot.username}', itemName:'${item.name}'})">E</button>
                         <button class="cyber-btn danger" style="padding:1px 3px; font-size:0.6rem;" onclick="app.emitCmd('drop', {username:'${bot.username}', itemName:'${item.name}'})">D</button>
                    </div>
                `;
                grid.appendChild(div);
            });
        }
    }

    renderEquipmentSlot(elementId, item) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.innerHTML = '';
        if (item) {
            const iconUrl = `https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.20.1/items/${item.name}.png`;
            el.innerHTML = `
                <!-- IMG REMOVED -->
                <div class="count-badge">${item.count}</div>
            `;
            el.setAttribute('data-desc', `${item.name} (x${item.count})`);
        } else {
            // Reset tooltip
            const defaultDesc = elementId.replace('slot-', '');
            el.setAttribute('data-desc', defaultDesc.charAt(0).toUpperCase() + defaultDesc.slice(1));
        }
    }

    clearEquipmentSlots() {
        ['slot-head', 'slot-chest', 'slot-legs', 'slot-feet', 'slot-offhand'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });
    }

    toggleSelectAll(checked) {
        if (checked) this.list.forEach(b => this.selected.add(b.username));
        else this.selected.clear();
        this.updateList(this.list);
    }

    deploy() {
        const ip = document.getElementById('deploy-host').value;
        const port = document.getElementById('deploy-port').value;
        const count = document.getElementById('deploy-count').value;
        if (!ip || !port) return alert("Host/Port required");
        this.socket.emit('requestAddBot', { ip, port, count, version: false });
    }

    disconnectSelected() {
        this.selected.forEach(username => this.socket.emit('requestRemoveBot', { username }));
        this.selected.clear();
    }

    updateMapSelection() {
        const select = document.getElementById('map-bot-select');
        if (!select) return;
        const current = select.value;
        select.innerHTML = '<option value="">-- NO SIGNAL --</option>';
        this.list.forEach(bot => {
            const opt = document.createElement('option');
            opt.value = bot.username;
            opt.textContent = bot.username;
            select.appendChild(opt);
        });

        // Auto select first if none and available
        if (!current && this.list.length > 0) {
            // select.value = this.list[0].username;
            // this.requestMap(this.list[0].username);
        } else if (current) {
            select.value = current;
        }

        select.onchange = () => {
            if (select.value) this.requestMap(select.value);
        };
    }

    requestMap(username) {
        document.getElementById('map-overlay').innerHTML = `<h3 class="glow-text">ESTABLISHING UPLINK TO ${username}...</h3>`;
        this.socket.emit('requestMap', { username });
    }

    // Profiles
    updateProfiles(data) {
        this.profiles = data;
        const sel = document.getElementById('profile-select');
        sel.innerHTML = '<option value="">Select Profile...</option>';
        data.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = p.name;
            sel.appendChild(opt);
        });
    }

    loadProfile() {
        const name = document.getElementById('profile-select').value;
        const p = this.profiles.find(x => x.name === name);
        if (p) {
            document.getElementById('deploy-host').value = p.ip;
            document.getElementById('deploy-port').value = p.port;
            document.getElementById('deploy-count').value = p.count || 1;
        }
    }

    saveProfile() {
        const name = prompt("Profile Name:");
        if (!name) return;
        this.socket.emit('saveProfile', {
            name,
            ip: document.getElementById('deploy-host').value,
            port: document.getElementById('deploy-port').value,
            count: document.getElementById('deploy-count').value
        });
    }

    delProfile() {
        const name = document.getElementById('profile-select').value;
        if (name && confirm("Delete?")) this.socket.emit('deleteProfile', name);
    }
}

class OperationModule {
    constructor(socket) {
        this.socket = socket;

        this.socket.on('ddosLog', (msg) => this.logDDoS(msg));
        this.socket.on('ddosStatus', (data) => {
            if (data.status === 'stopped') document.getElementById('ddos-status').className = 'status-pill offline';
        });

        this.socket.on('intelResult', (data) => {
            document.getElementById('intel-results').style.display = 'grid';
            document.getElementById('intel-motd').textContent = data.motd;
            document.getElementById('intel-ver').textContent = data.version;
            document.getElementById('intel-pop').textContent = `${data.online}/${data.max}`;
            document.getElementById('intel-ping').textContent = `${data.latency}ms`;
        });
        this.socket.on('playerList', (players) => this.renderMapPlayers(players));
    }

    renderMapPlayers(players) {
        const container = document.getElementById('map-players-container');
        if (!container) return; // Not on map view or element missing

        if (!players || players.length === 0) {
            container.innerHTML = '<div style="color:#777; text-align:center;">No signals detected.</div>';
            return;
        }

        container.innerHTML = '';
        players.forEach(p => {
            const row = document.createElement('div');
            row.className = 'flex justify-between align-center mb-10';
            row.style.borderBottom = '1px solid #333';
            row.style.paddingBottom = '5px';

            // Distance calc (if position available)
            let distStr = '';
            // We don't have bot pos here easily unless we sync it too.
            // faster to just show coords if available.
            if (p.entity && p.entity.position) {
                const pos = p.entity.position;
                distStr = `<span style="font-size:0.7rem; color:#666;">[${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}]</span>`;
            }

            row.innerHTML = `
                <div>
                    <div style="color:${p.isBot ? 'var(--accent-gold)' : 'var(--primary-cyan)'}; font-weight:bold;">${p.username}</div>
                    ${distStr}
                </div>
                <button class="cyber-btn" style="padding:2px 8px; font-size:0.7rem;" 
                    onclick="app.emitCmd('goto', {x:${p.entity?.position?.x || 0}, y:${p.entity?.position?.y || 0}, z:${p.entity?.position?.z || 0} })">GOTO</button>
             `;
            container.appendChild(row);
        });
    }

    startDDoS() {
        const ip = document.getElementById('ddos-ip').value;
        const port = document.getElementById('ddos-port').value;
        const numBots = document.getElementById('ddos-threads').value;
        if (!ip) return;

        document.getElementById('ddos-status').className = 'status-pill busy';
        document.getElementById('ddos-status').textContent = 'ENGAGING';
        this.socket.emit('requestDDoS', { action: 'start', ip, port, numBots });
    }

    stopDDoS() {
        this.socket.emit('requestDDoS', { action: 'stop' });
    }

    logDDoS(msg) {
        const log = document.getElementById('ddos-log');
        const d = document.createElement('div');
        d.className = 'log-entry info';
        d.textContent = `> ${msg}`;
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
    }

    scanIntel() {
        const ip = document.getElementById('intel-ip').value;
        const port = document.getElementById('intel-port').value || 25565;
        const proxy = document.getElementById('intel-proxy').value;
        if (ip) this.socket.emit('requestIntel', { ip, port, proxy });
    }

    zoomMap(direction) {
        const frame = document.getElementById('map-frame');
        if (!frame) return;

        // Ensure data-scale is initialized
        let currentScale = parseFloat(frame.getAttribute('data-scale')) || 1;
        let newScale = currentScale + (direction * 0.2);

        // Clamp scale
        if (newScale < 0.2) newScale = 0.2;
        if (newScale > 3.0) newScale = 3.0;

        frame.style.transformOrigin = 'center center'; // Fix zoom anchor
        frame.style.transform = `scale(${newScale})`;
        frame.setAttribute('data-scale', newScale);
    }
}

class ProxyModule {
    constructor(socket) {
        this.socket = socket;
        this.socket.on('proxyUpdate', (data) => {
            document.getElementById('proxy-pool-count').textContent = `${data.count} ACTIVE`;
            const list = document.getElementById('proxy-list');
            list.innerHTML = '';
            if (data.list) {
                data.list.forEach(p => {
                    const d = document.createElement('div');
                    d.textContent = p;
                    d.style.color = '#87CEEB';
                    list.appendChild(d);
                });
            }
        });
    }

    refresh() { this.socket.emit('proxyAction', { action: 'refresh' }); }
    verify() { this.socket.emit('proxyAction', { action: 'verify' }); }
    upload() {
        const list = document.getElementById('proxy-input').value;
        if (list) {
            this.socket.emit('proxyAction', { action: 'upload', list });
            alert("Uploaded.");
        }
    }
    enrich() {
        const count = prompt("Target Count:");
        if (count) this.socket.emit('proxyAction', { action: 'enrich', target: parseInt(count) });
    }
}

class LogModule {
    constructor(socket) {
        this.socket = socket;
        this.container = document.getElementById('global-logs');

        this.socket.on('log', (data) => {
            this.add(data.type, data.message);
        });

        // Map Listeners
        this.socket.on('mapReady', (data) => {
            const frame = document.getElementById('map-frame');
            const overlay = document.getElementById('map-overlay');
            overlay.style.display = 'none';
            frame.src = data.url;
        });
    }

    add(type, msg) {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.innerHTML = `<span style="opacity:0.5">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        this.container.appendChild(div);

        if (this.container.scrollHeight - this.container.scrollTop < 600) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }
}


class PluginModule {
    constructor(socket) {
        this.socket = socket;
        this.socket.on('pluginResult', (data) => this.renderResults(data));
        this.socket.on('pluginList', (data) => this.renderResults({ plugins: data })); // Handle variant
    }

    scan() {
        const ip = document.getElementById('plugin-ip').value;
        const port = document.getElementById('plugin-port').value;
        if (!ip) return alert("Target IP required");

        const btn = document.querySelector('#view-plugins button');
        btn.disabled = true;
        btn.textContent = "SCANNING...";

        document.getElementById('plugin-status').className = 'status-pill busy';
        document.getElementById('plugin-status').textContent = 'SCANNING';
        document.getElementById('plugin-results').innerHTML = '<div style="color:var(--accent-gold); text-align:center; padding-top:20px;">DEPLOYING PROBE...</div>';

        this.socket.emit('requestPluginScan', { ip, port });
    }

    renderResults(data) {
        const btn = document.querySelector('#view-plugins button');
        btn.disabled = false;
        btn.textContent = "INITIATE SCAN";

        document.getElementById('plugin-status').className = 'status-pill online';
        document.getElementById('plugin-status').textContent = 'COMPLETE';

        const container = document.getElementById('plugin-results');
        container.innerHTML = '';

        if (data.error) {
            container.innerHTML = `<div style="color:#ff5555; padding:10px;">ERROR: ${data.error}</div>`;
            return;
        }

        if (!data.plugins || data.plugins.length === 0) {
            container.innerHTML = `<div style="color:#777; padding:10px;">No plugins detected or hidden.</div>`;
            return;
        }

        // Handle string array or comma-separated string
        let list = [];
        if (Array.isArray(data.plugins)) list = data.plugins;
        else if (typeof data.plugins === 'string') list = data.plugins.split(',').map(s => s.trim());

        list.forEach(p => {
            // Basic cleaning and validation
            const cleanName = p.replace(/§[0-9a-fk-or]/g, '').trim();
            if (cleanName.length === 0) return;

            const pill = document.createElement('span');
            pill.className = 'status-pill';
            pill.style.margin = '2px';
            pill.textContent = cleanName;
            container.appendChild(pill);
        });

        if (container.children.length === 0) {
            container.innerHTML = `<div style="color:var(--text-dim); padding:10px;">No plugins found (or empty list returned).</div>`;
        }
    }
}

class RelayModule {
    constructor(socket) {
        this.socket = socket;
        this.status = 'offline';

        this.socket.on('relayLog', (data) => this.log(data));
    }

    start() {
        const ip = document.getElementById('relay-ip').value;
        const port = document.getElementById('relay-port').value;
        if (!ip) return alert("Target IP required.");

        this.status = 'connecting';
        this.updateStatus();
        this.socket.emit('requestRelay', { action: 'start', ip, port });
    }

    stop() {
        this.socket.emit('requestRelay', { action: 'stop' });
        this.status = 'offline';
        this.updateStatus();
    }

    log(data) {
        const term = document.getElementById('relay-log');

        // Handle System/Error statuses
        if (data.type === 'system' || data.type === 'error') {
            const row = document.createElement('div');
            row.style.marginBottom = '5px';
            row.style.color = data.type === 'error' ? '#ff5555' : '#ffff55';
            row.textContent = `[SYS] ${data.message}`;
            term.appendChild(row);

            if (data.message.includes('Live')) {
                this.status = 'online';
                this.updateStatus();
            }
            if (data.message.includes('disconnected') || data.message.includes('Signal lost')) {
                this.status = 'offline';
                this.updateStatus();
            }
        }

        // Handle Chat
        if (data.type === 'chat') {
            const row = document.createElement('div');
            row.style.borderBottom = '1px solid #333';
            row.style.padding = '2px 0';
            row.innerHTML = `<span style="color:#888;">[${data.timestamp}]</span> <span style="color:var(--primary-cyan);">${data.username}</span>: <span style="color:#fff;">${data.message}</span>`;
            term.appendChild(row);
        }

        term.scrollTop = term.scrollHeight;
    }

    updateStatus() {
        const el = document.getElementById('relay-status');
        if (this.status === 'online') {
            el.className = 'status-pill online';
            el.textContent = 'INTERCEPTING';
        } else if (this.status === 'connecting') {
            el.className = 'status-pill busy';
            el.textContent = 'CONNECTING...';
        } else {
            el.className = 'status-pill offline';
            el.textContent = 'DISCONNECTED';
        }
    }
}

// Initialize
window.app = new DashboardApp();

