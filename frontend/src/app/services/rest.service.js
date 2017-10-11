'use strict';

(function () {
    angular
        .module('app')
        .factory('restService', restService);

    restService.$inject = ['$http', 'serverDomain'];

    function restService($http, serverDomain) {
        var token = uuid();

        return {
            reset: function (data) {
                return $http.post(serverDomain + 'api/reset?token=' + token, data);
            },
            getNextGeneration: function (data) {
                return $http.get(serverDomain + 'api/next-generation?token=' + token);
            },
            getStatus: function (data) {
                return $http.get(serverDomain + 'api/check-status?token=' + token, data);
            },
        };
    }

    function uuid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
})();
