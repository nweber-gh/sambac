'use strict';

/* globals System */
/* globals jasminum */

window.jasminum = {
    start(specFile) {
        System.import(specFile)
            .then(() => {
                window.onload();
                jasminum.decorate();
            });
    },
    //decorate() {
    //    let jasmineBanner = document.querySelector('.banner'),
    //        allSpecsButton = document.createElement('a');
    //
    //    allSpecsButton.href = '/';
    //    allSpecsButton.className = 'run-options';
    //    allSpecsButton.innerHTML = '<span class="trigger">All Specs</span>';
    //    jasmineBanner.appendChild(allSpecsButton);
    //},
    decorate() {
        document.querySelector('a').href = '/';
        document.querySelector('a').target = '';
    }
};

window.addEventListener('load', () => {
    jasminum.decorate();
});
