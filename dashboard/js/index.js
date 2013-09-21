function SettingsCtrl($scope) {
    dpd('__resources').get(Context.resourceId, function(res, err) {
        $scope.cron = res.cron;
        $scope.$apply();
    });




    $scope.submit = function() {
        var data = {cron: $scope.cron}
        dpd('__resources').put(Context.resourceId, data, function(res, err) {
            ui.notify("Saved").hide(5000).effect('slide');
            refreshMeta();
        });
    }

      refreshMeta();
    function refreshMeta() {
        dpd(Context.resourceId).get({},  function(res, error) {
                $scope.nextInvocation = res.nextInvocation;
                $scope.$apply();
        });
    }

}
