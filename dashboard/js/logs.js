
function LogsCtrl($scope) {
    dpd(Context.resourceId).get("logs",{ $sort: {"date": -1}},  function(res, error) {
        $scope.logEntries = res;
        $scope.$apply();
    });
}
