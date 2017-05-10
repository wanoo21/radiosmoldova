"use strict";
// https://github.com/vinaygopinath/ngMeta
class mainCtrl {
  constructor (ngMeta) {
    this.title = 1

    ngMeta.setTitle('Radio online pentru Chrome', '')
    ngMeta.setTag('description', 'Asculata radio online din Romania, Rusia si Republica Moldova direct din browserul tau chrome, fara intrerupere si absolut gratuit!')
  }

  testFn () {
    this.title++
  }
}

class installCtrl {
  constructor (ngMeta) {
    ngMeta.setTitle('Install extension for chrome browser')
  }
}

class uninstallCtrl {
  constructor (ngMeta) {
    ngMeta.setTitle('We are sorry for uninstalling')
  }
}

const radio = angular.module('radio', ['ngRoute', 'ngMeta'])
radio.controller('mainCtrl', mainCtrl)
radio.controller('installCtrl', installCtrl)
radio.controller('uninstallCtrl', uninstallCtrl)

radio.directive('routeLink', () => {
  return {
    restrict: 'E',
    template: `<a href="#!{{to}}" ng-transclude></a>`,
    transclude: true,
    replace: true,
    scope: {
      to: '@'
    }
  }
})

// Configs
radio.config(['$routeProvider', '$locationProvider', 'ngMetaProvider', ($routeProvider, $locationProvider, ngMetaProvider) => {
  $routeProvider.when('/', {
    templateUrl: './templates/home.html',
    controller: 'mainCtrl',
    controllerAs: 'main'
  }).when('/install', {
    templateUrl: './templates/install.html',
    controller: 'installCtrl',
    controllerAs: 'install'
  }).when('/uninstall', {
    templateUrl: './templates/uninstall.html',
    controller: 'uninstallCtrl',
    controllerAs: 'uninstall'
  })
  $routeProvider.otherwise('/')
  $locationProvider.html5Mode(false)

  ngMetaProvider.useTitleSuffix(true)
  ngMetaProvider.setDefaultTitleSuffix(' | Radio online')
  ngMetaProvider.setDefaultTag('author', 'Ion Prodan');
}])

radio.run(['ngMeta', (ngMeta) => {
  ngMeta.init()
}]);