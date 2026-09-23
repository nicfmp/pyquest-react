(function () {
    'use strict';
    window.CodeBudgetValidator = {
        validar (activity, analysis) {
            const limit = Number(activity.instructionBudget) || null;
            const used = Number(analysis.instructionCount) || 0;
            return { valid: !limit || used <= limit, limit, used };
        }
    };
})();
