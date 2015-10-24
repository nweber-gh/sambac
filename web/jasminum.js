'use strict';

/* globals System */
/* globals jasminum */

window.jasminum = {
    start() {
        if(arguments.length > 0) {
            let promises = [];

            for(let i = 0; i < arguments.length; i++) {
                promises.push(System.import(arguments[i]));
            }

            Promise
                .all(promises)
                .then(() => {
                    window.onload();
                    jasminum.decorate(true);
                });
        }
    },
    decorate(loaded) {
        document.querySelector('a').href = '/';
        document.querySelector('a').target = '';

        if(!loaded) {
            let bar = document.querySelector('.bar');
            bar.textContent = 'Loading and tanspiling...';

            jasminum.loadingInterval = setInterval(() => {
                bar.textContent += '.';
            }, 20);
        } else {
            clearInterval(jasminum.loadingInterval);
        }
    }
};

window.addEventListener('load', () => {
    jasminum.decorate();
});
