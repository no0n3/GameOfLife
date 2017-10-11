'use strict';

(function () {
    angular
        .module('app', ['ngRoute', 'angular-gestures'])
        .config(function (hammerDefaultOptsProvider) {
            hammerDefaultOptsProvider.set({
                recognizers: [
                    [Hammer.Pinch, {enable: true}]
                ]
            });
        });
})();
