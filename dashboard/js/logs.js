
function LogsCtrl($scope) {
    dpd(Context.resourceId).get({ $sort: {"date": -1}},  function(res, error) {
        $scope.logEntries = res;
        $scope.$apply();
    });
}
