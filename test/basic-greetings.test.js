const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const dictionary = require('../dictionary.json');
const imageWords = require('../imagewords.json');
const phrases = require('../public/phrases.json');

test('Basic Greetings completes with both completion and sorting questions', async () => {
    const page = readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];
    const viewport = { innerHTML: '' };
    const storage = new Map();
    const timers = [];
    const data = {
        '/api/dictionary': dictionary,
        '/api/imagewords': imageWords,
        '/phrases.json': phrases
    };
    const context = vm.createContext({
        fetch: async url => ({ ok: Object.hasOwn(data, url), json: async () => data[url] }),
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value)
        },
        document: {
            getElementById: id => {
                assert.equal(id, 'app-viewport');
                return viewport;
            },
            createElement: () => ({
                style: {},
                set textContent(value) {
                    this.innerHTML = value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
                },
                remove() {}
            }),
            body: { appendChild() {} }
        },
        setTimeout: callback => timers.push(callback)
    });

    await vm.runInContext(script, context);
    assert.match(viewport.innerHTML, /Welcome to Lithuanian Language Learning/);
    vm.runInContext('startLevel(0, 0)', context);

    const level = dictionary.sections[0].levels[0];
    assert.equal(level.title, 'Basic Greetings');
    assert.deepEqual(new Set(level.sentences.map(question => question.type)), new Set(['completion', 'sorting']));

    function clickByLabel(label) {
        const controls = [...viewport.innerHTML.matchAll(/<button\b([^>]*)>([^<]*)<\/button>/g)];
        const control = controls.find(([, attributes, text]) =>
            text.trim() === label && !/\bdisabled\b/.test(attributes)
        );
        assert.ok(control, `Expected an enabled button labeled "${label}"`);
        const handler = control[1].match(/onclick="([^"]+)"/);
        assert.ok(handler, `Expected a click handler for "${label}"`);
        vm.runInContext(handler[1], context);
    }

    for (const question of level.sentences) {
        if (question.type === 'completion') {
            assert.match(viewport.innerHTML, /disabled>Submit Answer/);
            clickByLabel(question.options.find(option => option !== question.missing));
            assert.equal(timers.length, 0, 'Selecting a choice should not submit it');
            clickByLabel(question.missing);
            assert.equal(timers.length, 0, 'Changing a choice should not submit it');
            assert.equal((viewport.innerHTML.match(/aria-pressed="true"/g) || []).length, 1);
            clickByLabel('Submit Answer');
        } else {
            assert.match(viewport.innerHTML, /aria-label="Available words"/);
            for (const token of question.correctOrder) {
                clickByLabel(token);
            }
            clickByLabel('Check Sentence');
        }
        assert.equal(timers.length, 1, 'Each answer should schedule one advance');
        timers.shift()();
    }

    assert.match(viewport.innerHTML, /Lesson Complete/);
    assert.match(viewport.innerHTML, /100%/);
    assert.match(viewport.innerHTML, new RegExp(`${level.sentences.length} out of ${level.sentences.length} correct`));
    assert.equal(JSON.parse(storage.get('lt_progress'))['0-0'], true);
});
