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

 var deqpProgram = (function() {
'use strict';

/**
 * Shader type enum
 * @enum {number}
 */
var shaderType = {
	VERTEX: 0,
	FRAGMENT: 1
};

/**
 * Get GL shader type from shaderType
 * @param gl WebGL context
 * @param {shaderType} type Shader Type
 * @return GL shader type
 */
var getGLShaderType = function(gl, type) {
	var _glShaderType;
	switch (type) {
	case shaderType.VERTEX: _glShaderType = gl.VERTEX_SHADER; break;
	case shaderType.FRAGMENT: _glShaderType = gl.FRAGMENT_SHADER; break;
	default:
		testFailed("Unknown shader type " + type);
	}
	
	return _glShaderType;
};

/**
 * Declares shader information
 */
var ShaderInfo = function() {
	this.type;			/** Shader type. */
	this.source;			/** Shader source. */
	this.infoLog;		/** Compile info log. */
	this.compileOk = false;		/** Did compilation succeed? */
	this.compileTimeUs = 0;	/** Compile time in microseconds (us). */
};

/**
 * Generates vertex shader info from source 
 * @param source 
 * @return vertex shader info
 */
var genVertexSource = function(source) {
	var shader = new ShaderInfo();
	shader.source = source;
	shader.type = shaderType.VERTEX;
	return shader;
};

/**
 * Generates fragment shader info from source 
 * @param source 
 * @return fragment shader info
 */
var genFragmentSource = function(source) {
	var shader = new ShaderInfo();
	shader.source = source;
	shader.type = shaderType.FRAGMENT;
	return shader;
};

/**
 * Generates shader from WebGL context and type
 * @param gl WebGL context
 * @param {shaderType} type Shader Type
 */
var Shader = function(gl, type) {
	this.gl = gl;
	this.info = new ShaderInfo();		/** Client-side clone of state for debug / perf reasons. */
	this.info.type = type;
	this.shader	= gl.createShader(getGLShaderType(gl, type));
	assertMsg(gl.getError() == gl.NO_ERROR, "glCreateShader()");

	this.setSources = function(source) {
		this.gl.shaderSource(this.shader, source);
		assertMsg(this.gl.getError() == this.gl.NO_ERROR, "glshaderSource()");
		this.info.source = source;
	};
	
	this.getCompileStatus = function() {
		return this.info.compileOk;
	};
	
	this.compile = function() {
		this.info.compileOk		= false;
		this.info.compileTimeUs	= 0;
		this.info.infoLog = "";

		
		var compileStart = new Date();
		this.gl.compileShader(this.shader);
		var compileEnd = new Date();
		this.info.compileTimeUs = 1000 * (compileEnd.getTime() - compileStart.getTime());

		assertMsg(this.gl.getError() == this.gl.NO_ERROR, "glCompileShader()");

		var compileStatus = this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS);
		assertMsg(this.gl.getError() == this.gl.NO_ERROR, "glGetShaderParameter()");

		this.info.compileOk = compileStatus;
		this.info.infoLog = this.gl.getShaderInfoLog(this.shader);
	};
	
	this.getShader = function() {
		return this.shader;
	};
	
};

var ProgramInfo = function() {
	/** @type {string} */ var				infoLog;
	/** @type {bool} */ var		linkOk = false;
	/** @type {number} */ var	linkTimeUs = 0;	
};

/**
 * Creates program.
 * Inner methods: attach shaders, bind attributes location, link program and transform Feedback Varyings
 * @param gl WebGL context
 * @param programID
 */
var Program = function(gl, programID) {
	this.gl = gl;
	this.program = programID;
	this.info = new ProgramInfo();
	
	if (programID == null) {
		this.program = gl.createProgram();
		assertMsg(gl.getError() == gl.NO_ERROR, "glCreateProgram()");
	}
	
	this.attachShader = function(shader) {
		this.gl.attachShader(this.program, shader);
		assertMsg(this.gl.getError() == this.gl.NO_ERROR, "gl.attachShader()");
	};

	this.bindAttribLocation = function(location, name) {
		this.gl.bindAttribLocation(this.program, location, name);
		assertMsg(this.gl.getError() == this.gl.NO_ERROR, "gl.bindAttribLocation()");
	};
	
	this.link = function() {
		this.info.linkOk		= false;
		this.info.linkTimeUs	= 0;
		this.info.infoLog = "";

		var linkStart = new Date();
		this.gl.linkProgram(this.program);
		var linkEnd = new Date();
		this.info.linkTimeUs = 1000 *(linkEnd.getTime() - linkStart.getTime());
		
		assertMsg(this.gl.getError() == this.gl.NO_ERROR, "glLinkProgram()");

		var linkStatus = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
		assertMsg(this.gl.getError() == this.gl.NO_ERROR, "gl.getProgramParameter()");
		this.info.linkOk	= linkStatus;
		this.info.infoLog	= this.gl.getProgramInfoLog(this.program);
	};
	
	this.transformFeedbackVaryings = function(varyings, bufferMode) {
		this.gl.transformFeedbackVaryings(this.program, varyings, bufferMode);
		assertMsg(this.gl.getError() == this.gl.NO_ERROR, "gl.transformFeedbackVaryings()");
	};
};

/**
 * Assigns gl WebGL context and programSources. Declares array of shaders and new program()
 * @param gl WebGL context
 * @param programSources
 */
var ShaderProgram = function(gl, programSources) {
	this.gl = gl;
	this.programSources = programSources;
	this.shaders = []
	this.program = new Program(gl);

	this.getProgram = function() {
		return this.program.program;
		};
	
	this.getProgramInfo = function() {
		return this.program.info;
	};

	/** @type {bool} */ var shadersOK = true;

		for (var i = 0; i < programSources.sources.length; i++) {
			var shader = new Shader(gl, programSources.sources[i].type);
			shader.setSources(programSources.sources[i].source);
			shader.compile();
			this.shaders.push(shader);
			shadersOK = shadersOK && shader.getCompileStatus();
		}
		
		if (shadersOK) {
			for (var i = 0; i < this.shaders.length; i++)
				this.program.attachShader(this.shaders[i].getShader());
			
			for (var attrib in programSources.attribLocationBindings)
				this.program.bindAttribLocation(programSources.attribLocationBindings[attrib], attrib);

			if (programSources.transformFeedbackBufferMode)
				if (programSources.transformFeedbackBufferMode === gl.NONE)
					assertMsg(programSources.transformFeedbackVaryings.length === 0, "Transform feedback sanity check");
				else
					this.program.transformFeedbackVaryings(programSources.transformFeedbackVaryings, programSources.transformFeedbackBufferMode);

			/* TODO: GLES 3.1: set separable flag */

			this.program.link();
			
		}

};

return {
	ShaderProgram: ShaderProgram,
	shaderType: shaderType,
	genVertexSource: genVertexSource,
	genFragmentSource: genFragmentSource
};

}());
