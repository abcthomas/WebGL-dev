/*-------------------------------------------------------------------------
 * drawElements Quality Program OpenGL ES Utilities
 * ------------------------------------------------
 *
 * Copyright 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/**
 * This class allows one to create a hierarchy of tests and iterate over them.
 * It replaces TestCase and TestCaseGroup classes.
 */
var deqpTest = (function() {

var DeqpTest = function(name, description, spec) {
	this.name = name;
	this.description = description;
	this.spec = spec;
	this.currentTest = 0;
	this.parentTest = null;
	
	/**
	 * Returns the next 'leaf' test in the hierarchy of tests
	 *
	 * @return {Object} Test specification
	 */
	this.next = function() {
		var test = null;
		
		if (this.spec.length) {
			while (!test) {
				if (this.currentTest < this.spec.length) {
					test = this.spec[this.currentTest].next();
					if (!test)
						this.currentTest += 1;
				} else
					break;
			}
			
		} else if (this.currentTest === 0) {
			this.currentTest += 1;
			test = this;
		}
		return test;
	};
	
	/**
	 * Returns the full name of the test
	 *
	 * @return {string} Full test name.
	 */
	this.fullName = function() {
		if (this.parentTest)
			var parentName = this.parentTest.fullName();
			if (parentName)
				return parentName + '.' + this.name;
		return this.name;
	};
};

/**
 * Defines a new test
 *
 * @param {string} name Short test name
 * @param {string} description Description of the test
 * @param {(Array.<DeqpTest>|Object)} spec Test specification or an array of DeqpTests
 *
 * @return {DeqpTest} The new test
 */
var newTest = function(name, description, spec) {
	var test = new DeqpTest(name, description, spec);

	if (spec.length) {
		for (var i = 0; i < spec.length; i++)
			spec[i].parentTest = test;
	}
	
	return test;
}

return {
	newTest: newTest
};

}());
