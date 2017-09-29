define([
    'common/util/ejs',
    'text!./contractClassStart.ejs',
    'text!./contractClassEnd.ejs',
    'text!./contractStates.ejs',
    'text!./contractSingleTransition.ejs',
    'text!./contractSingleTransitionStart.ejs',
    'text!./contractSingleTransitionArguments.ejs',
    'text!./contractSingleTransitionStartEnd.ejs',
    'text!./contractSingleTransitionReturn.ejs',
    'text!./contractSingleTransitionOutput.ejs',
    'text!./contractSingleTransitionRequireState.ejs',
    'text!./contractSingleTransitionRequireGuards.ejs',
    'text!./contractSingleTransitionGuards.ejs',
    'text!./contractSingleTransitionEndGuards.ejs',
    'text!./contractSingleTransitionStatements.ejs',
    'text!./contractSingleTransitionStateChange.ejs',
    'text!./contractUserDefinitions.ejs',
    'text!./contractTransitions.ejs',
    'text!./contractComplete.ejs',
    'text!./contractPlugins.ejs'
], function (ejs,
             classStart,
             classEnd,
             states,
             singleTransition,
             singleTransitionStart,
             singleTransitionArguments,
             singleTransitionStartEnd,
             singleTransitionReturn,
             singleTransitionOutput,
             singleTransitionRequireState,
             singleTransitionRequireGuards,
             singleTransitionGuards,
             singleTransitionEndGuards,
             singleTransitionStatements,
             singleTransitionStateChange,
             userDefinitions,
             transitions,
             complete,
             plugins) {

    return {
        contractType: {
            classStart: classStart,
            classEnd: classEnd,
            states: states,
            transitions: transitions,
            singleTransition: singleTransition,
            singleTransitionStart: singleTransitionStart,
            singleTransitionArguments: singleTransitionArguments,
            singleTransitionStartEnd: singleTransitionStartEnd,
            singleTransitionReturn: singleTransitionReturn,
            singleTransitionOutput: singleTransitionOutput,
            singleTransitionRequireState: singleTransitionRequireState,
            singleTransitionRequireGuards: singleTransitionRequireGuards,
            singleTransitionGuards: singleTransitionGuards,
            singleTransitionEndGuards: singleTransitionEndGuards,
            singleTransitionStatements: singleTransitionStatements,
            singleTransitionStateChange: singleTransitionStateChange,
            userDefinitions: userDefinitions,
            plugins: plugins,
            complete: ejs.render(complete, {
                classStart: classStart,
                classEnd: classEnd,
                states: states,
                plugins: plugins,
                transitions: transitions,
                userDefinitions: userDefinitions
            })
        }
    };
});
