'use strict';

var minimatch = require('minimatch');

module.exports = function (file, condition) {
	if (!file) {
		throw new Error('gulp-match: vinyl file required');
	}

	if (typeof condition === 'boolean') {
		return condition;
	}

	if (typeof condition === 'function') {
		return !!condition(file);
	}

	if (typeof condition === 'string' && condition.match(/^\*\.[a-z\.]+$/)) {
		var newCond = condition.substring(1).replace(/\./g,'\\.')+'$';
		condition = new RegExp(newCond);
	}

	if (typeof condition === 'object' && typeof condition.test === 'function' && condition.hasOwnProperty('source')) {
		// FRAGILE: ASSUME: it's a regex
		return condition.test(file.path);
	}

	if (typeof condition === 'string') {
		// FRAGILE: ASSUME: it's a minimatch expression
		return minimatch(file.path, condition);
	}

	if (Array.isArray(condition)) {
		// Copy the array as we may modify it later.
		var conditions = condition.slice(0);

		// FRAGILE: ASSUME: it's a minimatch expression
		if (!conditions.length) {
			throw new Error('gulp-match: empty glob array');
		}
		var i = 0, step, ret = false;
		var hasNonNegate = conditions.some(function(expression) {
			return expression && expression[0] !== '!';
		});
		if (!hasNonNegate) {
			conditions.push('**/*');
		}
		for (i = 0; i < conditions.length; i++) {
			step = conditions[i];
			if (step[0] === '!') {
				if (minimatch(file.path, step.slice(1))) {
					return false;
				}
			} else if (minimatch(file.path, step)) {
				ret = true;
			}
		}
		return ret;
	}

	if (typeof condition === 'object') {
		if (condition.hasOwnProperty('isFile') || condition.hasOwnProperty('isDirectory')) {
			if (!file.hasOwnProperty('stat')) {
				return false; // TODO: what's a better status?
			}
			if (condition.hasOwnProperty('isFile')) {
				return (condition.isFile === file.stat.isFile());
			}
			if (condition.hasOwnProperty('isDirectory')) {
				return (condition.isDirectory === file.stat.isDirectory());
			}
		}
	}

	return !!condition;
};
