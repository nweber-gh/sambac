'use strict';

/* globals System */
/* globals sambac */

window.sambac = {
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
                    sambac.decorate(true);
                });
        }
    },
    decorate(loaded) {
        document.querySelector('a').href = '/';
        document.querySelector('a').target = '';

        if(!loaded) {
            let bar = document.querySelector('.bar');
            bar.textContent = 'Loading and transpiling...';

            sambac.loadingInterval = setInterval(() => {
                bar.textContent += '.';
            }, 20);
        } else {
            clearInterval(sambac.loadingInterval);
        }
    }
};

window.addEventListener('load', () => {
    sambac.decorate();
});
