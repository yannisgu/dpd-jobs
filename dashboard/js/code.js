angular.module('Jobs', ['ui.ace']);

function SettingsCtrl($scope) {
    var fileName = Context.resourceId + ".js";
    var startDate = new Date();
    dpd('__resources').get(Context.resourceId + '/' + fileName, function(res, err) {
        $scope.$apply(function() {
            $scope.code   = res && res.value;
        });
    });
    $scope.submit = function() {
        dpd('__resources').post(Context.resourceId + '/' + fileName, {value: $scope.code}, function(res, err) {

        });
    }
    $scope.runScript = function() {
        var fileNameTemp = "draft.js";
        dpd('__resources').post(Context.resourceId + '/' + fileNameTemp, {value: $scope.code},function(res, err) {
            loadLogs();
        });
    }

    function loadLogs() {
        dpd(Context.resourceId).post( {file : "draft"}, function() {
            dpd(Context.resourceId).get("logs", { date: {$gt: startDate.getTime()}, $sort: {"date": -1}},  function(res, error) {
                $scope.logEntries = res;
                $scope.$apply();
            });
        })
    }
}

