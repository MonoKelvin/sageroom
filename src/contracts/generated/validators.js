// \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
// node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	function ucs2length(str) {
		const len = str.length;
		let length = 0;
		let pos = 0;
		let value;
		while (pos < len) {
			length++;
			value = str.charCodeAt(pos++);
			if (value >= 55296 && value <= 56319 && pos < len) {
				value = str.charCodeAt(pos);
				if ((value & 64512) === 56320) pos++;
			}
		}
		return length;
	}
	exports.default = ucs2length;
	ucs2length.code = "require(\"ajv/dist/runtime/ucs2length\").default";
}));
// generated/validators.raw.js
var validateAgentListRequest = validate20;
function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate20.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id")) {
			validate20.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id")) {
				validate20.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate20.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
			}
		}
	} else {
		validate20.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate20.errors = vErrors;
	return true;
}
validate20.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateAgentListResponse = validate21;
var schema34 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema35 = {
	"type": "object",
	"properties": {
		"agent_id": { "type": "string" },
		"revision": { "$ref": "#/$defs/DecimalString" },
		"display_name": { "type": "string" },
		"introduction": { "type": "string" },
		"gender_description": { "type": ["string", "null"] },
		"address_terms": {
			"type": "array",
			"items": { "type": "string" }
		},
		"language_style": { "type": "string" },
		"skill": { "type": "string" },
		"dimensions": { "$ref": "#/$defs/PersonaDimensions" },
		"avatar_id": { "type": ["string", "null"] },
		"agent_type": { "$ref": "#/$defs/AgentType" },
		"model": { "anyOf": [{ "$ref": "#/$defs/AgentModelSnapshot" }, { "type": "null" }] },
		"preferences": { "$ref": "#/$defs/AgentPreferences" }
	},
	"additionalProperties": false,
	"required": [
		"agent_id",
		"revision",
		"display_name",
		"introduction",
		"gender_description",
		"address_terms",
		"language_style",
		"skill",
		"dimensions",
		"avatar_id",
		"agent_type",
		"model",
		"preferences"
	]
};
var schema38 = {
	"type": "string",
	"enum": ["social", "tool"]
};
var func1 = Object.prototype.hasOwnProperty;
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
var schema42 = {
	"type": "string",
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	]
};
var schema44 = {
	"type": "string",
	"enum": ["off", "enabled"]
};
function validate26(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate26.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate26.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "temperature" || key0 === "top_p" || key0 === "max_output_tokens" || key0 === "input_budget" || key0 === "reasoning")) {
				validate26.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.temperature !== void 0) {
				let data0 = data.temperature;
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 2 || isNaN(data0)) {
						validate26.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 2
							},
							message: "must be <= 2"
						}];
						return false;
					} else if (data0 < 0 || isNaN(data0)) {
						validate26.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: 0
							},
							message: "must be >= 0"
						}];
						return false;
					}
				} else {
					validate26.errors = [{
						instancePath: instancePath + "/temperature",
						schemaPath: "#/properties/temperature/type",
						keyword: "type",
						params: { type: "number" },
						message: "must be number"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.top_p !== void 0) {
					let data1 = data.top_p;
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 1 || isNaN(data1)) {
							validate26.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 1
								},
								message: "must be <= 1"
							}];
							return false;
						} else if (data1 < 0 || isNaN(data1)) {
							validate26.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/minimum",
								keyword: "minimum",
								params: {
									comparison: ">=",
									limit: 0
								},
								message: "must be >= 0"
							}];
							return false;
						}
					} else {
						validate26.errors = [{
							instancePath: instancePath + "/top_p",
							schemaPath: "#/properties/top_p/type",
							keyword: "type",
							params: { type: "number" },
							message: "must be number"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.max_output_tokens !== void 0) {
						let data2 = data.max_output_tokens;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate26.errors = [{
								instancePath: instancePath + "/max_output_tokens",
								schemaPath: "#/properties/max_output_tokens/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 32768 || isNaN(data2)) {
								validate26.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 32768
									},
									message: "must be <= 32768"
								}];
								return false;
							} else if (data2 < 1 || isNaN(data2)) {
								validate26.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 1
									},
									message: "must be >= 1"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.input_budget !== void 0) {
							let data3 = data.input_budget;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
								validate26.errors = [{
									instancePath: instancePath + "/input_budget",
									schemaPath: "#/properties/input_budget/type",
									keyword: "type",
									params: { type: "integer" },
									message: "must be integer"
								}];
								return false;
							}
							if (typeof data3 == "number" && isFinite(data3)) {
								if (data3 > 128e3 || isNaN(data3)) {
									validate26.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 128e3
										},
										message: "must be <= 128000"
									}];
									return false;
								} else if (data3 < 256 || isNaN(data3)) {
									validate26.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: 256
										},
										message: "must be >= 256"
									}];
									return false;
								}
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.reasoning !== void 0) {
								let data4 = data.reasoning;
								if (typeof data4 !== "string") {
									validate26.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "off" || data4 === "enabled")) {
									validate26.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/enum",
										keyword: "enum",
										params: { allowedValues: schema44.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate26.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate26.errors = vErrors;
	return true;
}
validate26.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate25(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate25.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters")) {
				validate25.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "protocol" || key0 === "base_url" || key0 === "model_name" || key0 === "parameters")) {
					validate25.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.id !== void 0) {
						const _errs2 = errors;
						if (typeof data.id !== "string") {
							validate25.errors = [{
								instancePath: instancePath + "/id",
								schemaPath: "#/properties/id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.name !== void 0) {
							let data1 = data.name;
							const _errs4 = errors;
							if (errors === _errs4) {
								if (typeof data1 === "string") {
									if (func2(data1) > 80) {
										validate25.errors = [{
											instancePath: instancePath + "/name",
											schemaPath: "#/properties/name/maxLength",
											keyword: "maxLength",
											params: { limit: 80 },
											message: "must NOT have more than 80 characters"
										}];
										return false;
									} else if (func2(data1) < 1) {
										validate25.errors = [{
											instancePath: instancePath + "/name",
											schemaPath: "#/properties/name/minLength",
											keyword: "minLength",
											params: { limit: 1 },
											message: "must NOT have fewer than 1 characters"
										}];
										return false;
									}
								} else {
									validate25.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.protocol !== void 0) {
								let data2 = data.protocol;
								const _errs6 = errors;
								if (typeof data2 !== "string") {
									validate25.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data2 === "openai_chat_completions" || data2 === "anthropic_messages" || data2 === "openai_responses")) {
									validate25.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema42.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.base_url !== void 0) {
									let data3 = data.base_url;
									const _errs9 = errors;
									if (errors === _errs9) {
										if (typeof data3 === "string") {
											if (func2(data3) > 2048) {
												validate25.errors = [{
													instancePath: instancePath + "/base_url",
													schemaPath: "#/properties/base_url/maxLength",
													keyword: "maxLength",
													params: { limit: 2048 },
													message: "must NOT have more than 2048 characters"
												}];
												return false;
											} else if (func2(data3) < 1) {
												validate25.errors = [{
													instancePath: instancePath + "/base_url",
													schemaPath: "#/properties/base_url/minLength",
													keyword: "minLength",
													params: { limit: 1 },
													message: "must NOT have fewer than 1 characters"
												}];
												return false;
											}
										} else {
											validate25.errors = [{
												instancePath: instancePath + "/base_url",
												schemaPath: "#/properties/base_url/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.model_name !== void 0) {
										let data4 = data.model_name;
										const _errs11 = errors;
										if (errors === _errs11) {
											if (typeof data4 === "string") {
												if (func2(data4) > 200) {
													validate25.errors = [{
														instancePath: instancePath + "/model_name",
														schemaPath: "#/properties/model_name/maxLength",
														keyword: "maxLength",
														params: { limit: 200 },
														message: "must NOT have more than 200 characters"
													}];
													return false;
												} else if (func2(data4) < 1) {
													validate25.errors = [{
														instancePath: instancePath + "/model_name",
														schemaPath: "#/properties/model_name/minLength",
														keyword: "minLength",
														params: { limit: 1 },
														message: "must NOT have fewer than 1 characters"
													}];
													return false;
												}
											} else {
												validate25.errors = [{
													instancePath: instancePath + "/model_name",
													schemaPath: "#/properties/model_name/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.parameters !== void 0) {
											const _errs13 = errors;
											if (!validate26(data.parameters, {
												instancePath: instancePath + "/parameters",
												parentData: data,
												parentDataProperty: "parameters",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate25.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate25.errors = vErrors;
	return errors === 0;
}
validate25.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate24(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate24.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.source_profile_id === void 0 && (missing0 = "source_profile_id") || data.source_profile_revision === void 0 && (missing0 = "source_profile_revision") || data.profile === void 0 && (missing0 = "profile")) {
				validate24.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "source_profile_id" || key0 === "source_profile_revision" || key0 === "profile")) {
					validate24.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.source_profile_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.source_profile_id !== "string") {
							validate24.errors = [{
								instancePath: instancePath + "/source_profile_id",
								schemaPath: "#/properties/source_profile_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.source_profile_revision !== void 0) {
							let data1 = data.source_profile_revision;
							const _errs4 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										validate24.errors = [{
											instancePath: instancePath + "/source_profile_revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data1)) {
										validate24.errors = [{
											instancePath: instancePath + "/source_profile_revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate24.errors = [{
										instancePath: instancePath + "/source_profile_revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.profile !== void 0) {
								const _errs7 = errors;
								if (!validate25(data.profile, {
									instancePath: instancePath + "/profile",
									parentData: data,
									parentDataProperty: "profile",
									rootData,
									dynamicAnchors
								})) {
									vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
									errors = vErrors.length;
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
						}
					}
				}
			}
		} else {
			validate24.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate24.errors = vErrors;
	return errors === 0;
}
validate24.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate23.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.agent_id === void 0 && (missing0 = "agent_id") || data.revision === void 0 && (missing0 = "revision") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.gender_description === void 0 && (missing0 = "gender_description") || data.address_terms === void 0 && (missing0 = "address_terms") || data.language_style === void 0 && (missing0 = "language_style") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.agent_type === void 0 && (missing0 = "agent_type") || data.model === void 0 && (missing0 = "model") || data.preferences === void 0 && (missing0 = "preferences")) {
				validate23.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema35.properties, key0)) {
					validate23.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.agent_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.agent_id !== "string") {
							validate23.errors = [{
								instancePath: instancePath + "/agent_id",
								schemaPath: "#/properties/agent_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.revision !== void 0) {
							let data1 = data.revision;
							const _errs4 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										validate23.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data1)) {
										validate23.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate23.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.display_name !== void 0) {
								const _errs7 = errors;
								if (typeof data.display_name !== "string") {
									validate23.errors = [{
										instancePath: instancePath + "/display_name",
										schemaPath: "#/properties/display_name/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.introduction !== void 0) {
									const _errs9 = errors;
									if (typeof data.introduction !== "string") {
										validate23.errors = [{
											instancePath: instancePath + "/introduction",
											schemaPath: "#/properties/introduction/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.gender_description !== void 0) {
										let data4 = data.gender_description;
										const _errs11 = errors;
										if (typeof data4 !== "string" && data4 !== null) {
											validate23.errors = [{
												instancePath: instancePath + "/gender_description",
												schemaPath: "#/properties/gender_description/type",
												keyword: "type",
												params: { type: schema35.properties.gender_description.type },
												message: "must be string,null"
											}];
											return false;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.address_terms !== void 0) {
											let data5 = data.address_terms;
											const _errs13 = errors;
											if (errors === _errs13) {
												if (Array.isArray(data5)) {
													const len0 = data5.length;
													for (let i0 = 0; i0 < len0; i0++) {
														const _errs15 = errors;
														if (typeof data5[i0] !== "string") {
															validate23.errors = [{
																instancePath: instancePath + "/address_terms/" + i0,
																schemaPath: "#/properties/address_terms/items/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
														if (!(_errs15 === errors)) break;
													}
												} else {
													validate23.errors = [{
														instancePath: instancePath + "/address_terms",
														schemaPath: "#/properties/address_terms/type",
														keyword: "type",
														params: { type: "array" },
														message: "must be array"
													}];
													return false;
												}
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.language_style !== void 0) {
												const _errs17 = errors;
												if (typeof data.language_style !== "string") {
													validate23.errors = [{
														instancePath: instancePath + "/language_style",
														schemaPath: "#/properties/language_style/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												var valid0 = _errs17 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.skill !== void 0) {
													const _errs19 = errors;
													if (typeof data.skill !== "string") {
														validate23.errors = [{
															instancePath: instancePath + "/skill",
															schemaPath: "#/properties/skill/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
													var valid0 = _errs19 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.dimensions !== void 0) {
														let data9 = data.dimensions;
														const _errs21 = errors;
														if (errors === errors) {
															if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
																let missing1;
																if (data9.professional === void 0 && (missing1 = "professional") || data9.formal === void 0 && (missing1 = "formal") || data9.casual === void 0 && (missing1 = "casual") || data9.humor === void 0 && (missing1 = "humor") || data9.direct === void 0 && (missing1 = "direct") || data9.empathy === void 0 && (missing1 = "empathy") || data9.social_energy === void 0 && (missing1 = "social_energy")) {
																	validate23.errors = [{
																		instancePath: instancePath + "/dimensions",
																		schemaPath: "#/$defs/PersonaDimensions/required",
																		keyword: "required",
																		params: { missingProperty: missing1 },
																		message: "must have required property '" + missing1 + "'"
																	}];
																	return false;
																} else {
																	const _errs24 = errors;
																	for (const key1 in data9) if (!(key1 === "professional" || key1 === "formal" || key1 === "casual" || key1 === "humor" || key1 === "direct" || key1 === "empathy" || key1 === "social_energy")) {
																		validate23.errors = [{
																			instancePath: instancePath + "/dimensions",
																			schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
																			keyword: "additionalProperties",
																			params: { additionalProperty: key1 },
																			message: "must NOT have additional properties"
																		}];
																		return false;
																	}
																	if (_errs24 === errors) {
																		if (data9.professional !== void 0) {
																			let data10 = data9.professional;
																			const _errs25 = errors;
																			if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																				validate23.errors = [{
																					instancePath: instancePath + "/dimensions/professional",
																					schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
																					keyword: "type",
																					params: { type: "integer" },
																					message: "must be integer"
																				}];
																				return false;
																			}
																			if (errors === _errs25) {
																				if (typeof data10 == "number" && isFinite(data10)) {
																					if (data10 > 100 || isNaN(data10)) {
																						validate23.errors = [{
																							instancePath: instancePath + "/dimensions/professional",
																							schemaPath: "#/$defs/PersonaDimensions/properties/professional/maximum",
																							keyword: "maximum",
																							params: {
																								comparison: "<=",
																								limit: 100
																							},
																							message: "must be <= 100"
																						}];
																						return false;
																					} else if (data10 < 0 || isNaN(data10)) {
																						validate23.errors = [{
																							instancePath: instancePath + "/dimensions/professional",
																							schemaPath: "#/$defs/PersonaDimensions/properties/professional/minimum",
																							keyword: "minimum",
																							params: {
																								comparison: ">=",
																								limit: 0
																							},
																							message: "must be >= 0"
																						}];
																						return false;
																					}
																				}
																			}
																			var valid4 = _errs25 === errors;
																		} else var valid4 = true;
																		if (valid4) {
																			if (data9.formal !== void 0) {
																				let data11 = data9.formal;
																				const _errs27 = errors;
																				if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																					validate23.errors = [{
																						instancePath: instancePath + "/dimensions/formal",
																						schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
																						keyword: "type",
																						params: { type: "integer" },
																						message: "must be integer"
																					}];
																					return false;
																				}
																				if (errors === _errs27) {
																					if (typeof data11 == "number" && isFinite(data11)) {
																						if (data11 > 100 || isNaN(data11)) {
																							validate23.errors = [{
																								instancePath: instancePath + "/dimensions/formal",
																								schemaPath: "#/$defs/PersonaDimensions/properties/formal/maximum",
																								keyword: "maximum",
																								params: {
																									comparison: "<=",
																									limit: 100
																								},
																								message: "must be <= 100"
																							}];
																							return false;
																						} else if (data11 < 0 || isNaN(data11)) {
																							validate23.errors = [{
																								instancePath: instancePath + "/dimensions/formal",
																								schemaPath: "#/$defs/PersonaDimensions/properties/formal/minimum",
																								keyword: "minimum",
																								params: {
																									comparison: ">=",
																									limit: 0
																								},
																								message: "must be >= 0"
																							}];
																							return false;
																						}
																					}
																				}
																				var valid4 = _errs27 === errors;
																			} else var valid4 = true;
																			if (valid4) {
																				if (data9.casual !== void 0) {
																					let data12 = data9.casual;
																					const _errs29 = errors;
																					if (!(typeof data12 == "number" && !(data12 % 1) && !isNaN(data12) && isFinite(data12))) {
																						validate23.errors = [{
																							instancePath: instancePath + "/dimensions/casual",
																							schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																							keyword: "type",
																							params: { type: "integer" },
																							message: "must be integer"
																						}];
																						return false;
																					}
																					if (errors === _errs29) {
																						if (typeof data12 == "number" && isFinite(data12)) {
																							if (data12 > 100 || isNaN(data12)) {
																								validate23.errors = [{
																									instancePath: instancePath + "/dimensions/casual",
																									schemaPath: "#/$defs/PersonaDimensions/properties/casual/maximum",
																									keyword: "maximum",
																									params: {
																										comparison: "<=",
																										limit: 100
																									},
																									message: "must be <= 100"
																								}];
																								return false;
																							} else if (data12 < 0 || isNaN(data12)) {
																								validate23.errors = [{
																									instancePath: instancePath + "/dimensions/casual",
																									schemaPath: "#/$defs/PersonaDimensions/properties/casual/minimum",
																									keyword: "minimum",
																									params: {
																										comparison: ">=",
																										limit: 0
																									},
																									message: "must be >= 0"
																								}];
																								return false;
																							}
																						}
																					}
																					var valid4 = _errs29 === errors;
																				} else var valid4 = true;
																				if (valid4) {
																					if (data9.humor !== void 0) {
																						let data13 = data9.humor;
																						const _errs31 = errors;
																						if (!(typeof data13 == "number" && !(data13 % 1) && !isNaN(data13) && isFinite(data13))) {
																							validate23.errors = [{
																								instancePath: instancePath + "/dimensions/humor",
																								schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
																								keyword: "type",
																								params: { type: "integer" },
																								message: "must be integer"
																							}];
																							return false;
																						}
																						if (errors === _errs31) {
																							if (typeof data13 == "number" && isFinite(data13)) {
																								if (data13 > 100 || isNaN(data13)) {
																									validate23.errors = [{
																										instancePath: instancePath + "/dimensions/humor",
																										schemaPath: "#/$defs/PersonaDimensions/properties/humor/maximum",
																										keyword: "maximum",
																										params: {
																											comparison: "<=",
																											limit: 100
																										},
																										message: "must be <= 100"
																									}];
																									return false;
																								} else if (data13 < 0 || isNaN(data13)) {
																									validate23.errors = [{
																										instancePath: instancePath + "/dimensions/humor",
																										schemaPath: "#/$defs/PersonaDimensions/properties/humor/minimum",
																										keyword: "minimum",
																										params: {
																											comparison: ">=",
																											limit: 0
																										},
																										message: "must be >= 0"
																									}];
																									return false;
																								}
																							}
																						}
																						var valid4 = _errs31 === errors;
																					} else var valid4 = true;
																					if (valid4) {
																						if (data9.direct !== void 0) {
																							let data14 = data9.direct;
																							const _errs33 = errors;
																							if (!(typeof data14 == "number" && !(data14 % 1) && !isNaN(data14) && isFinite(data14))) {
																								validate23.errors = [{
																									instancePath: instancePath + "/dimensions/direct",
																									schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																									keyword: "type",
																									params: { type: "integer" },
																									message: "must be integer"
																								}];
																								return false;
																							}
																							if (errors === _errs33) {
																								if (typeof data14 == "number" && isFinite(data14)) {
																									if (data14 > 100 || isNaN(data14)) {
																										validate23.errors = [{
																											instancePath: instancePath + "/dimensions/direct",
																											schemaPath: "#/$defs/PersonaDimensions/properties/direct/maximum",
																											keyword: "maximum",
																											params: {
																												comparison: "<=",
																												limit: 100
																											},
																											message: "must be <= 100"
																										}];
																										return false;
																									} else if (data14 < 0 || isNaN(data14)) {
																										validate23.errors = [{
																											instancePath: instancePath + "/dimensions/direct",
																											schemaPath: "#/$defs/PersonaDimensions/properties/direct/minimum",
																											keyword: "minimum",
																											params: {
																												comparison: ">=",
																												limit: 0
																											},
																											message: "must be >= 0"
																										}];
																										return false;
																									}
																								}
																							}
																							var valid4 = _errs33 === errors;
																						} else var valid4 = true;
																						if (valid4) {
																							if (data9.empathy !== void 0) {
																								let data15 = data9.empathy;
																								const _errs35 = errors;
																								if (!(typeof data15 == "number" && !(data15 % 1) && !isNaN(data15) && isFinite(data15))) {
																									validate23.errors = [{
																										instancePath: instancePath + "/dimensions/empathy",
																										schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																										keyword: "type",
																										params: { type: "integer" },
																										message: "must be integer"
																									}];
																									return false;
																								}
																								if (errors === _errs35) {
																									if (typeof data15 == "number" && isFinite(data15)) {
																										if (data15 > 100 || isNaN(data15)) {
																											validate23.errors = [{
																												instancePath: instancePath + "/dimensions/empathy",
																												schemaPath: "#/$defs/PersonaDimensions/properties/empathy/maximum",
																												keyword: "maximum",
																												params: {
																													comparison: "<=",
																													limit: 100
																												},
																												message: "must be <= 100"
																											}];
																											return false;
																										} else if (data15 < 0 || isNaN(data15)) {
																											validate23.errors = [{
																												instancePath: instancePath + "/dimensions/empathy",
																												schemaPath: "#/$defs/PersonaDimensions/properties/empathy/minimum",
																												keyword: "minimum",
																												params: {
																													comparison: ">=",
																													limit: 0
																												},
																												message: "must be >= 0"
																											}];
																											return false;
																										}
																									}
																								}
																								var valid4 = _errs35 === errors;
																							} else var valid4 = true;
																							if (valid4) {
																								if (data9.social_energy !== void 0) {
																									let data16 = data9.social_energy;
																									const _errs37 = errors;
																									if (!(typeof data16 == "number" && !(data16 % 1) && !isNaN(data16) && isFinite(data16))) {
																										validate23.errors = [{
																											instancePath: instancePath + "/dimensions/social_energy",
																											schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																											keyword: "type",
																											params: { type: "integer" },
																											message: "must be integer"
																										}];
																										return false;
																									}
																									if (errors === _errs37) {
																										if (typeof data16 == "number" && isFinite(data16)) {
																											if (data16 > 100 || isNaN(data16)) {
																												validate23.errors = [{
																													instancePath: instancePath + "/dimensions/social_energy",
																													schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/maximum",
																													keyword: "maximum",
																													params: {
																														comparison: "<=",
																														limit: 100
																													},
																													message: "must be <= 100"
																												}];
																												return false;
																											} else if (data16 < 0 || isNaN(data16)) {
																												validate23.errors = [{
																													instancePath: instancePath + "/dimensions/social_energy",
																													schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/minimum",
																													keyword: "minimum",
																													params: {
																														comparison: ">=",
																														limit: 0
																													},
																													message: "must be >= 0"
																												}];
																												return false;
																											}
																										}
																									}
																									var valid4 = _errs37 === errors;
																								} else var valid4 = true;
																							}
																						}
																					}
																				}
																			}
																		}
																	}
																}
															} else {
																validate23.errors = [{
																	instancePath: instancePath + "/dimensions",
																	schemaPath: "#/$defs/PersonaDimensions/type",
																	keyword: "type",
																	params: { type: "object" },
																	message: "must be object"
																}];
																return false;
															}
														}
														var valid0 = _errs21 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.avatar_id !== void 0) {
															let data17 = data.avatar_id;
															const _errs39 = errors;
															if (typeof data17 !== "string" && data17 !== null) {
																validate23.errors = [{
																	instancePath: instancePath + "/avatar_id",
																	schemaPath: "#/properties/avatar_id/type",
																	keyword: "type",
																	params: { type: schema35.properties.avatar_id.type },
																	message: "must be string,null"
																}];
																return false;
															}
															var valid0 = _errs39 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.agent_type !== void 0) {
																let data18 = data.agent_type;
																const _errs41 = errors;
																if (typeof data18 !== "string") {
																	validate23.errors = [{
																		instancePath: instancePath + "/agent_type",
																		schemaPath: "#/$defs/AgentType/type",
																		keyword: "type",
																		params: { type: "string" },
																		message: "must be string"
																	}];
																	return false;
																}
																if (!(data18 === "social" || data18 === "tool")) {
																	validate23.errors = [{
																		instancePath: instancePath + "/agent_type",
																		schemaPath: "#/$defs/AgentType/enum",
																		keyword: "enum",
																		params: { allowedValues: schema38.enum },
																		message: "must be equal to one of the allowed values"
																	}];
																	return false;
																}
																var valid0 = _errs41 === errors;
															} else var valid0 = true;
															if (valid0) {
																if (data.model !== void 0) {
																	let data19 = data.model;
																	const _errs44 = errors;
																	const _errs45 = errors;
																	let valid6 = false;
																	const _errs46 = errors;
																	if (!validate24(data19, {
																		instancePath: instancePath + "/model",
																		parentData: data,
																		parentDataProperty: "model",
																		rootData,
																		dynamicAnchors
																	})) {
																		vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
																		errors = vErrors.length;
																	}
																	var _valid0 = _errs46 === errors;
																	valid6 = valid6 || _valid0;
																	const _errs47 = errors;
																	if (data19 !== null) {
																		const err0 = {
																			instancePath: instancePath + "/model",
																			schemaPath: "#/properties/model/anyOf/1/type",
																			keyword: "type",
																			params: { type: "null" },
																			message: "must be null"
																		};
																		if (vErrors === null) vErrors = [err0];
																		else vErrors.push(err0);
																		errors++;
																	}
																	var _valid0 = _errs47 === errors;
																	valid6 = valid6 || _valid0;
																	if (!valid6) {
																		const err1 = {
																			instancePath: instancePath + "/model",
																			schemaPath: "#/properties/model/anyOf",
																			keyword: "anyOf",
																			params: {},
																			message: "must match a schema in anyOf"
																		};
																		if (vErrors === null) vErrors = [err1];
																		else vErrors.push(err1);
																		errors++;
																		validate23.errors = vErrors;
																		return false;
																	} else {
																		errors = _errs45;
																		if (vErrors !== null) {
																			if (_errs45) vErrors.length = _errs45;
																			else vErrors = null;
																		}
																	}
																	var valid0 = _errs44 === errors;
																} else var valid0 = true;
																if (valid0) {
																	if (data.preferences !== void 0) {
																		let data20 = data.preferences;
																		const _errs49 = errors;
																		if (errors === errors) {
																			if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
																				let missing2;
																				if (data20.request_limit_daily === void 0 && (missing2 = "request_limit_daily") || data20.persistent_memory === void 0 && (missing2 = "persistent_memory") || data20.allow_autonomous_wake === void 0 && (missing2 = "allow_autonomous_wake")) {
																					validate23.errors = [{
																						instancePath: instancePath + "/preferences",
																						schemaPath: "#/$defs/AgentPreferences/required",
																						keyword: "required",
																						params: { missingProperty: missing2 },
																						message: "must have required property '" + missing2 + "'"
																					}];
																					return false;
																				} else {
																					const _errs52 = errors;
																					for (const key2 in data20) if (!(key2 === "request_limit_daily" || key2 === "persistent_memory" || key2 === "allow_autonomous_wake")) {
																						validate23.errors = [{
																							instancePath: instancePath + "/preferences",
																							schemaPath: "#/$defs/AgentPreferences/additionalProperties",
																							keyword: "additionalProperties",
																							params: { additionalProperty: key2 },
																							message: "must NOT have additional properties"
																						}];
																						return false;
																					}
																					if (_errs52 === errors) {
																						if (data20.request_limit_daily !== void 0) {
																							let data21 = data20.request_limit_daily;
																							const _errs53 = errors;
																							if (!(typeof data21 == "number" && !(data21 % 1) && !isNaN(data21) && isFinite(data21))) {
																								validate23.errors = [{
																									instancePath: instancePath + "/preferences/request_limit_daily",
																									schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/type",
																									keyword: "type",
																									params: { type: "integer" },
																									message: "must be integer"
																								}];
																								return false;
																							}
																							if (errors === _errs53) {
																								if (typeof data21 == "number" && isFinite(data21)) {
																									if (data21 > 5e3 || isNaN(data21)) {
																										validate23.errors = [{
																											instancePath: instancePath + "/preferences/request_limit_daily",
																											schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/maximum",
																											keyword: "maximum",
																											params: {
																												comparison: "<=",
																												limit: 5e3
																											},
																											message: "must be <= 5000"
																										}];
																										return false;
																									} else if (data21 < 1 || isNaN(data21)) {
																										validate23.errors = [{
																											instancePath: instancePath + "/preferences/request_limit_daily",
																											schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/minimum",
																											keyword: "minimum",
																											params: {
																												comparison: ">=",
																												limit: 1
																											},
																											message: "must be >= 1"
																										}];
																										return false;
																									}
																								}
																							}
																							var valid8 = _errs53 === errors;
																						} else var valid8 = true;
																						if (valid8) {
																							if (data20.persistent_memory !== void 0) {
																								const _errs55 = errors;
																								if (typeof data20.persistent_memory !== "boolean") {
																									validate23.errors = [{
																										instancePath: instancePath + "/preferences/persistent_memory",
																										schemaPath: "#/$defs/AgentPreferences/properties/persistent_memory/type",
																										keyword: "type",
																										params: { type: "boolean" },
																										message: "must be boolean"
																									}];
																									return false;
																								}
																								var valid8 = _errs55 === errors;
																							} else var valid8 = true;
																							if (valid8) {
																								if (data20.allow_autonomous_wake !== void 0) {
																									const _errs57 = errors;
																									if (typeof data20.allow_autonomous_wake !== "boolean") {
																										validate23.errors = [{
																											instancePath: instancePath + "/preferences/allow_autonomous_wake",
																											schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																											keyword: "type",
																											params: { type: "boolean" },
																											message: "must be boolean"
																										}];
																										return false;
																									}
																									var valid8 = _errs57 === errors;
																								} else var valid8 = true;
																							}
																						}
																					}
																				}
																			} else {
																				validate23.errors = [{
																					instancePath: instancePath + "/preferences",
																					schemaPath: "#/$defs/AgentPreferences/type",
																					keyword: "type",
																					params: { type: "object" },
																					message: "must be object"
																				}];
																				return false;
																			}
																		}
																		var valid0 = _errs49 === errors;
																	} else var valid0 = true;
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate23.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate23.errors = vErrors;
	return errors === 0;
}
validate23.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate22(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate22.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate22.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate22.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate22.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate22.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema34.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							let data1 = data.data;
							const _errs5 = errors;
							if (errors === _errs5) {
								if (Array.isArray(data1)) {
									const len0 = data1.length;
									for (let i0 = 0; i0 < len0; i0++) {
										const _errs7 = errors;
										if (!validate23(data1[i0], {
											instancePath: instancePath + "/data/" + i0,
											parentData: data1,
											parentDataProperty: i0,
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
											errors = vErrors.length;
										}
										if (!(_errs7 === errors)) break;
									}
								} else {
									validate22.errors = [{
										instancePath: instancePath + "/data",
										schemaPath: "#/properties/data/type",
										keyword: "type",
										params: { type: "array" },
										message: "must be array"
									}];
									return false;
								}
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate22.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate22.errors = vErrors;
	return errors === 0;
}
validate22.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema48 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema49 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema50 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate33(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate33.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate33.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate33.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate33.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate33.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema49.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate33.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate33.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate33.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema50.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate33.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema48.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate33.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate33.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate33.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate33.errors = vErrors;
	return true;
}
validate33.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate32(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate32.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate32.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate32.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate32.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate32.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema34.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate33(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate33.errors : vErrors.concat(validate33.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate32.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate32.errors = vErrors;
	return errors === 0;
}
validate32.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate21.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate22(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate32(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate21.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate21.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate21.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateAgentSaveRequest = validate36;
var schema53 = {
	"type": "object",
	"properties": {
		"agent_id": { "type": "string" },
		"revision": { "$ref": "#/$defs/DecimalString" },
		"display_name": { "type": "string" },
		"introduction": { "type": "string" },
		"gender_description": { "type": ["string", "null"] },
		"address_terms": {
			"type": "array",
			"items": { "type": "string" }
		},
		"language_style": { "type": "string" },
		"skill": { "type": "string" },
		"dimensions": { "$ref": "#/$defs/PersonaDimensions" },
		"avatar_id": { "type": ["string", "null"] },
		"agent_type": { "$ref": "#/$defs/AgentType" },
		"model": { "anyOf": [{ "$ref": "#/$defs/AgentModelSnapshot" }, { "type": "null" }] },
		"preferences": { "$ref": "#/$defs/AgentPreferences" }
	},
	"additionalProperties": false,
	"required": [
		"agent_id",
		"revision",
		"display_name",
		"introduction",
		"address_terms",
		"language_style",
		"skill",
		"dimensions",
		"agent_type",
		"preferences"
	]
};
var schema56 = {
	"type": "string",
	"enum": ["social", "tool"]
};
var schema60 = {
	"type": "string",
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	]
};
var schema62 = {
	"type": "string",
	"enum": ["off", "enabled"]
};
function validate40(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate40.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate40.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "temperature" || key0 === "top_p" || key0 === "max_output_tokens" || key0 === "input_budget" || key0 === "reasoning")) {
				validate40.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.temperature !== void 0) {
				let data0 = data.temperature;
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 2 || isNaN(data0)) {
						validate40.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 2
							},
							message: "must be <= 2"
						}];
						return false;
					} else if (data0 < 0 || isNaN(data0)) {
						validate40.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: 0
							},
							message: "must be >= 0"
						}];
						return false;
					}
				} else {
					validate40.errors = [{
						instancePath: instancePath + "/temperature",
						schemaPath: "#/properties/temperature/type",
						keyword: "type",
						params: { type: "number" },
						message: "must be number"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.top_p !== void 0) {
					let data1 = data.top_p;
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 1 || isNaN(data1)) {
							validate40.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 1
								},
								message: "must be <= 1"
							}];
							return false;
						} else if (data1 < 0 || isNaN(data1)) {
							validate40.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/minimum",
								keyword: "minimum",
								params: {
									comparison: ">=",
									limit: 0
								},
								message: "must be >= 0"
							}];
							return false;
						}
					} else {
						validate40.errors = [{
							instancePath: instancePath + "/top_p",
							schemaPath: "#/properties/top_p/type",
							keyword: "type",
							params: { type: "number" },
							message: "must be number"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.max_output_tokens !== void 0) {
						let data2 = data.max_output_tokens;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate40.errors = [{
								instancePath: instancePath + "/max_output_tokens",
								schemaPath: "#/properties/max_output_tokens/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 32768 || isNaN(data2)) {
								validate40.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 32768
									},
									message: "must be <= 32768"
								}];
								return false;
							} else if (data2 < 1 || isNaN(data2)) {
								validate40.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 1
									},
									message: "must be >= 1"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.input_budget !== void 0) {
							let data3 = data.input_budget;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
								validate40.errors = [{
									instancePath: instancePath + "/input_budget",
									schemaPath: "#/properties/input_budget/type",
									keyword: "type",
									params: { type: "integer" },
									message: "must be integer"
								}];
								return false;
							}
							if (typeof data3 == "number" && isFinite(data3)) {
								if (data3 > 128e3 || isNaN(data3)) {
									validate40.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 128e3
										},
										message: "must be <= 128000"
									}];
									return false;
								} else if (data3 < 256 || isNaN(data3)) {
									validate40.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: 256
										},
										message: "must be >= 256"
									}];
									return false;
								}
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.reasoning !== void 0) {
								let data4 = data.reasoning;
								if (typeof data4 !== "string") {
									validate40.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "off" || data4 === "enabled")) {
									validate40.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/enum",
										keyword: "enum",
										params: { allowedValues: schema62.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate40.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate40.errors = vErrors;
	return true;
}
validate40.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate39(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate39.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters")) {
				validate39.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "protocol" || key0 === "base_url" || key0 === "model_name" || key0 === "parameters")) {
					validate39.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.id !== void 0) {
						const _errs2 = errors;
						if (typeof data.id !== "string") {
							validate39.errors = [{
								instancePath: instancePath + "/id",
								schemaPath: "#/properties/id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.name !== void 0) {
							let data1 = data.name;
							const _errs4 = errors;
							if (errors === _errs4) {
								if (typeof data1 === "string") {
									if (func2(data1) > 80) {
										validate39.errors = [{
											instancePath: instancePath + "/name",
											schemaPath: "#/properties/name/maxLength",
											keyword: "maxLength",
											params: { limit: 80 },
											message: "must NOT have more than 80 characters"
										}];
										return false;
									} else if (func2(data1) < 1) {
										validate39.errors = [{
											instancePath: instancePath + "/name",
											schemaPath: "#/properties/name/minLength",
											keyword: "minLength",
											params: { limit: 1 },
											message: "must NOT have fewer than 1 characters"
										}];
										return false;
									}
								} else {
									validate39.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.protocol !== void 0) {
								let data2 = data.protocol;
								const _errs6 = errors;
								if (typeof data2 !== "string") {
									validate39.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data2 === "openai_chat_completions" || data2 === "anthropic_messages" || data2 === "openai_responses")) {
									validate39.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema60.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.base_url !== void 0) {
									let data3 = data.base_url;
									const _errs9 = errors;
									if (errors === _errs9) {
										if (typeof data3 === "string") {
											if (func2(data3) > 2048) {
												validate39.errors = [{
													instancePath: instancePath + "/base_url",
													schemaPath: "#/properties/base_url/maxLength",
													keyword: "maxLength",
													params: { limit: 2048 },
													message: "must NOT have more than 2048 characters"
												}];
												return false;
											} else if (func2(data3) < 1) {
												validate39.errors = [{
													instancePath: instancePath + "/base_url",
													schemaPath: "#/properties/base_url/minLength",
													keyword: "minLength",
													params: { limit: 1 },
													message: "must NOT have fewer than 1 characters"
												}];
												return false;
											}
										} else {
											validate39.errors = [{
												instancePath: instancePath + "/base_url",
												schemaPath: "#/properties/base_url/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.model_name !== void 0) {
										let data4 = data.model_name;
										const _errs11 = errors;
										if (errors === _errs11) {
											if (typeof data4 === "string") {
												if (func2(data4) > 200) {
													validate39.errors = [{
														instancePath: instancePath + "/model_name",
														schemaPath: "#/properties/model_name/maxLength",
														keyword: "maxLength",
														params: { limit: 200 },
														message: "must NOT have more than 200 characters"
													}];
													return false;
												} else if (func2(data4) < 1) {
													validate39.errors = [{
														instancePath: instancePath + "/model_name",
														schemaPath: "#/properties/model_name/minLength",
														keyword: "minLength",
														params: { limit: 1 },
														message: "must NOT have fewer than 1 characters"
													}];
													return false;
												}
											} else {
												validate39.errors = [{
													instancePath: instancePath + "/model_name",
													schemaPath: "#/properties/model_name/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.parameters !== void 0) {
											const _errs13 = errors;
											if (!validate40(data.parameters, {
												instancePath: instancePath + "/parameters",
												parentData: data,
												parentDataProperty: "parameters",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate40.errors : vErrors.concat(validate40.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate39.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate39.errors = vErrors;
	return errors === 0;
}
validate39.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate38(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate38.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.source_profile_id === void 0 && (missing0 = "source_profile_id") || data.source_profile_revision === void 0 && (missing0 = "source_profile_revision") || data.profile === void 0 && (missing0 = "profile")) {
				validate38.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "source_profile_id" || key0 === "source_profile_revision" || key0 === "profile")) {
					validate38.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.source_profile_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.source_profile_id !== "string") {
							validate38.errors = [{
								instancePath: instancePath + "/source_profile_id",
								schemaPath: "#/properties/source_profile_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.source_profile_revision !== void 0) {
							let data1 = data.source_profile_revision;
							const _errs4 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										validate38.errors = [{
											instancePath: instancePath + "/source_profile_revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data1)) {
										validate38.errors = [{
											instancePath: instancePath + "/source_profile_revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate38.errors = [{
										instancePath: instancePath + "/source_profile_revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.profile !== void 0) {
								const _errs7 = errors;
								if (!validate39(data.profile, {
									instancePath: instancePath + "/profile",
									parentData: data,
									parentDataProperty: "profile",
									rootData,
									dynamicAnchors
								})) {
									vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
									errors = vErrors.length;
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
						}
					}
				}
			}
		} else {
			validate38.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate38.errors = vErrors;
	return errors === 0;
}
validate38.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate37(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate37.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.agent_id === void 0 && (missing0 = "agent_id") || data.revision === void 0 && (missing0 = "revision") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.address_terms === void 0 && (missing0 = "address_terms") || data.language_style === void 0 && (missing0 = "language_style") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.agent_type === void 0 && (missing0 = "agent_type") || data.preferences === void 0 && (missing0 = "preferences")) {
				validate37.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema53.properties, key0)) {
					validate37.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.agent_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.agent_id !== "string") {
							validate37.errors = [{
								instancePath: instancePath + "/agent_id",
								schemaPath: "#/properties/agent_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.revision !== void 0) {
							let data1 = data.revision;
							const _errs4 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										validate37.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data1)) {
										validate37.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate37.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.display_name !== void 0) {
								const _errs7 = errors;
								if (typeof data.display_name !== "string") {
									validate37.errors = [{
										instancePath: instancePath + "/display_name",
										schemaPath: "#/properties/display_name/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.introduction !== void 0) {
									const _errs9 = errors;
									if (typeof data.introduction !== "string") {
										validate37.errors = [{
											instancePath: instancePath + "/introduction",
											schemaPath: "#/properties/introduction/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.gender_description !== void 0) {
										let data4 = data.gender_description;
										const _errs11 = errors;
										if (typeof data4 !== "string" && data4 !== null) {
											validate37.errors = [{
												instancePath: instancePath + "/gender_description",
												schemaPath: "#/properties/gender_description/type",
												keyword: "type",
												params: { type: schema53.properties.gender_description.type },
												message: "must be string,null"
											}];
											return false;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.address_terms !== void 0) {
											let data5 = data.address_terms;
											const _errs13 = errors;
											if (errors === _errs13) {
												if (Array.isArray(data5)) {
													const len0 = data5.length;
													for (let i0 = 0; i0 < len0; i0++) {
														const _errs15 = errors;
														if (typeof data5[i0] !== "string") {
															validate37.errors = [{
																instancePath: instancePath + "/address_terms/" + i0,
																schemaPath: "#/properties/address_terms/items/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
														if (!(_errs15 === errors)) break;
													}
												} else {
													validate37.errors = [{
														instancePath: instancePath + "/address_terms",
														schemaPath: "#/properties/address_terms/type",
														keyword: "type",
														params: { type: "array" },
														message: "must be array"
													}];
													return false;
												}
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.language_style !== void 0) {
												const _errs17 = errors;
												if (typeof data.language_style !== "string") {
													validate37.errors = [{
														instancePath: instancePath + "/language_style",
														schemaPath: "#/properties/language_style/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												var valid0 = _errs17 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.skill !== void 0) {
													const _errs19 = errors;
													if (typeof data.skill !== "string") {
														validate37.errors = [{
															instancePath: instancePath + "/skill",
															schemaPath: "#/properties/skill/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
													var valid0 = _errs19 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.dimensions !== void 0) {
														let data9 = data.dimensions;
														const _errs21 = errors;
														if (errors === errors) {
															if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
																let missing1;
																if (data9.professional === void 0 && (missing1 = "professional") || data9.formal === void 0 && (missing1 = "formal") || data9.casual === void 0 && (missing1 = "casual") || data9.humor === void 0 && (missing1 = "humor") || data9.direct === void 0 && (missing1 = "direct") || data9.empathy === void 0 && (missing1 = "empathy") || data9.social_energy === void 0 && (missing1 = "social_energy")) {
																	validate37.errors = [{
																		instancePath: instancePath + "/dimensions",
																		schemaPath: "#/$defs/PersonaDimensions/required",
																		keyword: "required",
																		params: { missingProperty: missing1 },
																		message: "must have required property '" + missing1 + "'"
																	}];
																	return false;
																} else {
																	const _errs24 = errors;
																	for (const key1 in data9) if (!(key1 === "professional" || key1 === "formal" || key1 === "casual" || key1 === "humor" || key1 === "direct" || key1 === "empathy" || key1 === "social_energy")) {
																		validate37.errors = [{
																			instancePath: instancePath + "/dimensions",
																			schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
																			keyword: "additionalProperties",
																			params: { additionalProperty: key1 },
																			message: "must NOT have additional properties"
																		}];
																		return false;
																	}
																	if (_errs24 === errors) {
																		if (data9.professional !== void 0) {
																			let data10 = data9.professional;
																			const _errs25 = errors;
																			if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																				validate37.errors = [{
																					instancePath: instancePath + "/dimensions/professional",
																					schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
																					keyword: "type",
																					params: { type: "integer" },
																					message: "must be integer"
																				}];
																				return false;
																			}
																			if (errors === _errs25) {
																				if (typeof data10 == "number" && isFinite(data10)) {
																					if (data10 > 100 || isNaN(data10)) {
																						validate37.errors = [{
																							instancePath: instancePath + "/dimensions/professional",
																							schemaPath: "#/$defs/PersonaDimensions/properties/professional/maximum",
																							keyword: "maximum",
																							params: {
																								comparison: "<=",
																								limit: 100
																							},
																							message: "must be <= 100"
																						}];
																						return false;
																					} else if (data10 < 0 || isNaN(data10)) {
																						validate37.errors = [{
																							instancePath: instancePath + "/dimensions/professional",
																							schemaPath: "#/$defs/PersonaDimensions/properties/professional/minimum",
																							keyword: "minimum",
																							params: {
																								comparison: ">=",
																								limit: 0
																							},
																							message: "must be >= 0"
																						}];
																						return false;
																					}
																				}
																			}
																			var valid4 = _errs25 === errors;
																		} else var valid4 = true;
																		if (valid4) {
																			if (data9.formal !== void 0) {
																				let data11 = data9.formal;
																				const _errs27 = errors;
																				if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																					validate37.errors = [{
																						instancePath: instancePath + "/dimensions/formal",
																						schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
																						keyword: "type",
																						params: { type: "integer" },
																						message: "must be integer"
																					}];
																					return false;
																				}
																				if (errors === _errs27) {
																					if (typeof data11 == "number" && isFinite(data11)) {
																						if (data11 > 100 || isNaN(data11)) {
																							validate37.errors = [{
																								instancePath: instancePath + "/dimensions/formal",
																								schemaPath: "#/$defs/PersonaDimensions/properties/formal/maximum",
																								keyword: "maximum",
																								params: {
																									comparison: "<=",
																									limit: 100
																								},
																								message: "must be <= 100"
																							}];
																							return false;
																						} else if (data11 < 0 || isNaN(data11)) {
																							validate37.errors = [{
																								instancePath: instancePath + "/dimensions/formal",
																								schemaPath: "#/$defs/PersonaDimensions/properties/formal/minimum",
																								keyword: "minimum",
																								params: {
																									comparison: ">=",
																									limit: 0
																								},
																								message: "must be >= 0"
																							}];
																							return false;
																						}
																					}
																				}
																				var valid4 = _errs27 === errors;
																			} else var valid4 = true;
																			if (valid4) {
																				if (data9.casual !== void 0) {
																					let data12 = data9.casual;
																					const _errs29 = errors;
																					if (!(typeof data12 == "number" && !(data12 % 1) && !isNaN(data12) && isFinite(data12))) {
																						validate37.errors = [{
																							instancePath: instancePath + "/dimensions/casual",
																							schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																							keyword: "type",
																							params: { type: "integer" },
																							message: "must be integer"
																						}];
																						return false;
																					}
																					if (errors === _errs29) {
																						if (typeof data12 == "number" && isFinite(data12)) {
																							if (data12 > 100 || isNaN(data12)) {
																								validate37.errors = [{
																									instancePath: instancePath + "/dimensions/casual",
																									schemaPath: "#/$defs/PersonaDimensions/properties/casual/maximum",
																									keyword: "maximum",
																									params: {
																										comparison: "<=",
																										limit: 100
																									},
																									message: "must be <= 100"
																								}];
																								return false;
																							} else if (data12 < 0 || isNaN(data12)) {
																								validate37.errors = [{
																									instancePath: instancePath + "/dimensions/casual",
																									schemaPath: "#/$defs/PersonaDimensions/properties/casual/minimum",
																									keyword: "minimum",
																									params: {
																										comparison: ">=",
																										limit: 0
																									},
																									message: "must be >= 0"
																								}];
																								return false;
																							}
																						}
																					}
																					var valid4 = _errs29 === errors;
																				} else var valid4 = true;
																				if (valid4) {
																					if (data9.humor !== void 0) {
																						let data13 = data9.humor;
																						const _errs31 = errors;
																						if (!(typeof data13 == "number" && !(data13 % 1) && !isNaN(data13) && isFinite(data13))) {
																							validate37.errors = [{
																								instancePath: instancePath + "/dimensions/humor",
																								schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
																								keyword: "type",
																								params: { type: "integer" },
																								message: "must be integer"
																							}];
																							return false;
																						}
																						if (errors === _errs31) {
																							if (typeof data13 == "number" && isFinite(data13)) {
																								if (data13 > 100 || isNaN(data13)) {
																									validate37.errors = [{
																										instancePath: instancePath + "/dimensions/humor",
																										schemaPath: "#/$defs/PersonaDimensions/properties/humor/maximum",
																										keyword: "maximum",
																										params: {
																											comparison: "<=",
																											limit: 100
																										},
																										message: "must be <= 100"
																									}];
																									return false;
																								} else if (data13 < 0 || isNaN(data13)) {
																									validate37.errors = [{
																										instancePath: instancePath + "/dimensions/humor",
																										schemaPath: "#/$defs/PersonaDimensions/properties/humor/minimum",
																										keyword: "minimum",
																										params: {
																											comparison: ">=",
																											limit: 0
																										},
																										message: "must be >= 0"
																									}];
																									return false;
																								}
																							}
																						}
																						var valid4 = _errs31 === errors;
																					} else var valid4 = true;
																					if (valid4) {
																						if (data9.direct !== void 0) {
																							let data14 = data9.direct;
																							const _errs33 = errors;
																							if (!(typeof data14 == "number" && !(data14 % 1) && !isNaN(data14) && isFinite(data14))) {
																								validate37.errors = [{
																									instancePath: instancePath + "/dimensions/direct",
																									schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																									keyword: "type",
																									params: { type: "integer" },
																									message: "must be integer"
																								}];
																								return false;
																							}
																							if (errors === _errs33) {
																								if (typeof data14 == "number" && isFinite(data14)) {
																									if (data14 > 100 || isNaN(data14)) {
																										validate37.errors = [{
																											instancePath: instancePath + "/dimensions/direct",
																											schemaPath: "#/$defs/PersonaDimensions/properties/direct/maximum",
																											keyword: "maximum",
																											params: {
																												comparison: "<=",
																												limit: 100
																											},
																											message: "must be <= 100"
																										}];
																										return false;
																									} else if (data14 < 0 || isNaN(data14)) {
																										validate37.errors = [{
																											instancePath: instancePath + "/dimensions/direct",
																											schemaPath: "#/$defs/PersonaDimensions/properties/direct/minimum",
																											keyword: "minimum",
																											params: {
																												comparison: ">=",
																												limit: 0
																											},
																											message: "must be >= 0"
																										}];
																										return false;
																									}
																								}
																							}
																							var valid4 = _errs33 === errors;
																						} else var valid4 = true;
																						if (valid4) {
																							if (data9.empathy !== void 0) {
																								let data15 = data9.empathy;
																								const _errs35 = errors;
																								if (!(typeof data15 == "number" && !(data15 % 1) && !isNaN(data15) && isFinite(data15))) {
																									validate37.errors = [{
																										instancePath: instancePath + "/dimensions/empathy",
																										schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																										keyword: "type",
																										params: { type: "integer" },
																										message: "must be integer"
																									}];
																									return false;
																								}
																								if (errors === _errs35) {
																									if (typeof data15 == "number" && isFinite(data15)) {
																										if (data15 > 100 || isNaN(data15)) {
																											validate37.errors = [{
																												instancePath: instancePath + "/dimensions/empathy",
																												schemaPath: "#/$defs/PersonaDimensions/properties/empathy/maximum",
																												keyword: "maximum",
																												params: {
																													comparison: "<=",
																													limit: 100
																												},
																												message: "must be <= 100"
																											}];
																											return false;
																										} else if (data15 < 0 || isNaN(data15)) {
																											validate37.errors = [{
																												instancePath: instancePath + "/dimensions/empathy",
																												schemaPath: "#/$defs/PersonaDimensions/properties/empathy/minimum",
																												keyword: "minimum",
																												params: {
																													comparison: ">=",
																													limit: 0
																												},
																												message: "must be >= 0"
																											}];
																											return false;
																										}
																									}
																								}
																								var valid4 = _errs35 === errors;
																							} else var valid4 = true;
																							if (valid4) {
																								if (data9.social_energy !== void 0) {
																									let data16 = data9.social_energy;
																									const _errs37 = errors;
																									if (!(typeof data16 == "number" && !(data16 % 1) && !isNaN(data16) && isFinite(data16))) {
																										validate37.errors = [{
																											instancePath: instancePath + "/dimensions/social_energy",
																											schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																											keyword: "type",
																											params: { type: "integer" },
																											message: "must be integer"
																										}];
																										return false;
																									}
																									if (errors === _errs37) {
																										if (typeof data16 == "number" && isFinite(data16)) {
																											if (data16 > 100 || isNaN(data16)) {
																												validate37.errors = [{
																													instancePath: instancePath + "/dimensions/social_energy",
																													schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/maximum",
																													keyword: "maximum",
																													params: {
																														comparison: "<=",
																														limit: 100
																													},
																													message: "must be <= 100"
																												}];
																												return false;
																											} else if (data16 < 0 || isNaN(data16)) {
																												validate37.errors = [{
																													instancePath: instancePath + "/dimensions/social_energy",
																													schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/minimum",
																													keyword: "minimum",
																													params: {
																														comparison: ">=",
																														limit: 0
																													},
																													message: "must be >= 0"
																												}];
																												return false;
																											}
																										}
																									}
																									var valid4 = _errs37 === errors;
																								} else var valid4 = true;
																							}
																						}
																					}
																				}
																			}
																		}
																	}
																}
															} else {
																validate37.errors = [{
																	instancePath: instancePath + "/dimensions",
																	schemaPath: "#/$defs/PersonaDimensions/type",
																	keyword: "type",
																	params: { type: "object" },
																	message: "must be object"
																}];
																return false;
															}
														}
														var valid0 = _errs21 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.avatar_id !== void 0) {
															let data17 = data.avatar_id;
															const _errs39 = errors;
															if (typeof data17 !== "string" && data17 !== null) {
																validate37.errors = [{
																	instancePath: instancePath + "/avatar_id",
																	schemaPath: "#/properties/avatar_id/type",
																	keyword: "type",
																	params: { type: schema53.properties.avatar_id.type },
																	message: "must be string,null"
																}];
																return false;
															}
															var valid0 = _errs39 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.agent_type !== void 0) {
																let data18 = data.agent_type;
																const _errs41 = errors;
																if (typeof data18 !== "string") {
																	validate37.errors = [{
																		instancePath: instancePath + "/agent_type",
																		schemaPath: "#/$defs/AgentType/type",
																		keyword: "type",
																		params: { type: "string" },
																		message: "must be string"
																	}];
																	return false;
																}
																if (!(data18 === "social" || data18 === "tool")) {
																	validate37.errors = [{
																		instancePath: instancePath + "/agent_type",
																		schemaPath: "#/$defs/AgentType/enum",
																		keyword: "enum",
																		params: { allowedValues: schema56.enum },
																		message: "must be equal to one of the allowed values"
																	}];
																	return false;
																}
																var valid0 = _errs41 === errors;
															} else var valid0 = true;
															if (valid0) {
																if (data.model !== void 0) {
																	let data19 = data.model;
																	const _errs44 = errors;
																	const _errs45 = errors;
																	let valid6 = false;
																	const _errs46 = errors;
																	if (!validate38(data19, {
																		instancePath: instancePath + "/model",
																		parentData: data,
																		parentDataProperty: "model",
																		rootData,
																		dynamicAnchors
																	})) {
																		vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
																		errors = vErrors.length;
																	}
																	var _valid0 = _errs46 === errors;
																	valid6 = valid6 || _valid0;
																	const _errs47 = errors;
																	if (data19 !== null) {
																		const err0 = {
																			instancePath: instancePath + "/model",
																			schemaPath: "#/properties/model/anyOf/1/type",
																			keyword: "type",
																			params: { type: "null" },
																			message: "must be null"
																		};
																		if (vErrors === null) vErrors = [err0];
																		else vErrors.push(err0);
																		errors++;
																	}
																	var _valid0 = _errs47 === errors;
																	valid6 = valid6 || _valid0;
																	if (!valid6) {
																		const err1 = {
																			instancePath: instancePath + "/model",
																			schemaPath: "#/properties/model/anyOf",
																			keyword: "anyOf",
																			params: {},
																			message: "must match a schema in anyOf"
																		};
																		if (vErrors === null) vErrors = [err1];
																		else vErrors.push(err1);
																		errors++;
																		validate37.errors = vErrors;
																		return false;
																	} else {
																		errors = _errs45;
																		if (vErrors !== null) {
																			if (_errs45) vErrors.length = _errs45;
																			else vErrors = null;
																		}
																	}
																	var valid0 = _errs44 === errors;
																} else var valid0 = true;
																if (valid0) {
																	if (data.preferences !== void 0) {
																		let data20 = data.preferences;
																		const _errs49 = errors;
																		if (errors === errors) {
																			if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
																				let missing2;
																				if (data20.request_limit_daily === void 0 && (missing2 = "request_limit_daily") || data20.persistent_memory === void 0 && (missing2 = "persistent_memory") || data20.allow_autonomous_wake === void 0 && (missing2 = "allow_autonomous_wake")) {
																					validate37.errors = [{
																						instancePath: instancePath + "/preferences",
																						schemaPath: "#/$defs/AgentPreferences/required",
																						keyword: "required",
																						params: { missingProperty: missing2 },
																						message: "must have required property '" + missing2 + "'"
																					}];
																					return false;
																				} else {
																					const _errs52 = errors;
																					for (const key2 in data20) if (!(key2 === "request_limit_daily" || key2 === "persistent_memory" || key2 === "allow_autonomous_wake")) {
																						validate37.errors = [{
																							instancePath: instancePath + "/preferences",
																							schemaPath: "#/$defs/AgentPreferences/additionalProperties",
																							keyword: "additionalProperties",
																							params: { additionalProperty: key2 },
																							message: "must NOT have additional properties"
																						}];
																						return false;
																					}
																					if (_errs52 === errors) {
																						if (data20.request_limit_daily !== void 0) {
																							let data21 = data20.request_limit_daily;
																							const _errs53 = errors;
																							if (!(typeof data21 == "number" && !(data21 % 1) && !isNaN(data21) && isFinite(data21))) {
																								validate37.errors = [{
																									instancePath: instancePath + "/preferences/request_limit_daily",
																									schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/type",
																									keyword: "type",
																									params: { type: "integer" },
																									message: "must be integer"
																								}];
																								return false;
																							}
																							if (errors === _errs53) {
																								if (typeof data21 == "number" && isFinite(data21)) {
																									if (data21 > 5e3 || isNaN(data21)) {
																										validate37.errors = [{
																											instancePath: instancePath + "/preferences/request_limit_daily",
																											schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/maximum",
																											keyword: "maximum",
																											params: {
																												comparison: "<=",
																												limit: 5e3
																											},
																											message: "must be <= 5000"
																										}];
																										return false;
																									} else if (data21 < 1 || isNaN(data21)) {
																										validate37.errors = [{
																											instancePath: instancePath + "/preferences/request_limit_daily",
																											schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/minimum",
																											keyword: "minimum",
																											params: {
																												comparison: ">=",
																												limit: 1
																											},
																											message: "must be >= 1"
																										}];
																										return false;
																									}
																								}
																							}
																							var valid8 = _errs53 === errors;
																						} else var valid8 = true;
																						if (valid8) {
																							if (data20.persistent_memory !== void 0) {
																								const _errs55 = errors;
																								if (typeof data20.persistent_memory !== "boolean") {
																									validate37.errors = [{
																										instancePath: instancePath + "/preferences/persistent_memory",
																										schemaPath: "#/$defs/AgentPreferences/properties/persistent_memory/type",
																										keyword: "type",
																										params: { type: "boolean" },
																										message: "must be boolean"
																									}];
																									return false;
																								}
																								var valid8 = _errs55 === errors;
																							} else var valid8 = true;
																							if (valid8) {
																								if (data20.allow_autonomous_wake !== void 0) {
																									const _errs57 = errors;
																									if (typeof data20.allow_autonomous_wake !== "boolean") {
																										validate37.errors = [{
																											instancePath: instancePath + "/preferences/allow_autonomous_wake",
																											schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																											keyword: "type",
																											params: { type: "boolean" },
																											message: "must be boolean"
																										}];
																										return false;
																									}
																									var valid8 = _errs57 === errors;
																								} else var valid8 = true;
																							}
																						}
																					}
																				}
																			} else {
																				validate37.errors = [{
																					instancePath: instancePath + "/preferences",
																					schemaPath: "#/$defs/AgentPreferences/type",
																					keyword: "type",
																					params: { type: "object" },
																					message: "must be object"
																				}];
																				return false;
																			}
																		}
																		var valid0 = _errs49 === errors;
																	} else var valid0 = true;
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate37.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate37.errors = vErrors;
	return errors === 0;
}
validate37.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate36(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate36.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.configuration === void 0 && (missing0 = "configuration")) {
				validate36.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "client_request_id" || key0 === "expected_revision" || key0 === "configuration")) {
					validate36.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate36.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.client_request_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.client_request_id !== "string") {
								validate36.errors = [{
									instancePath: instancePath + "/client_request_id",
									schemaPath: "#/properties/client_request_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.expected_revision !== void 0) {
								let data2 = data.expected_revision;
								const _errs6 = errors;
								const _errs7 = errors;
								let valid1 = false;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											const err0 = {
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err0];
											else vErrors.push(err0);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err1 = {
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err1];
											else vErrors.push(err1);
											errors++;
										}
									} else {
										const err2 = {
											instancePath: instancePath + "/expected_revision",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err2];
										else vErrors.push(err2);
										errors++;
									}
								}
								var _valid0 = _errs8 === errors;
								valid1 = valid1 || _valid0;
								const _errs11 = errors;
								if (data2 !== null) {
									const err3 = {
										instancePath: instancePath + "/expected_revision",
										schemaPath: "#/properties/expected_revision/anyOf/1/type",
										keyword: "type",
										params: { type: "null" },
										message: "must be null"
									};
									if (vErrors === null) vErrors = [err3];
									else vErrors.push(err3);
									errors++;
								}
								var _valid0 = _errs11 === errors;
								valid1 = valid1 || _valid0;
								if (!valid1) {
									const err4 = {
										instancePath: instancePath + "/expected_revision",
										schemaPath: "#/properties/expected_revision/anyOf",
										keyword: "anyOf",
										params: {},
										message: "must match a schema in anyOf"
									};
									if (vErrors === null) vErrors = [err4];
									else vErrors.push(err4);
									errors++;
									validate36.errors = vErrors;
									return false;
								} else {
									errors = _errs7;
									if (vErrors !== null) {
										if (_errs7) vErrors.length = _errs7;
										else vErrors = null;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.configuration !== void 0) {
									const _errs13 = errors;
									if (!validate37(data.configuration, {
										instancePath: instancePath + "/configuration",
										parentData: data,
										parentDataProperty: "configuration",
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
										errors = vErrors.length;
									}
									var valid0 = _errs13 === errors;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		} else {
			validate36.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate36.errors = vErrors;
	return errors === 0;
}
validate36.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateAgentSaveResponse = validate45;
var schema66 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema67 = {
	"type": "object",
	"properties": {
		"agent_id": { "type": "string" },
		"revision": { "$ref": "#/$defs/DecimalString" },
		"display_name": { "type": "string" },
		"introduction": { "type": "string" },
		"gender_description": { "type": ["string", "null"] },
		"address_terms": {
			"type": "array",
			"items": { "type": "string" }
		},
		"language_style": { "type": "string" },
		"skill": { "type": "string" },
		"dimensions": { "$ref": "#/$defs/PersonaDimensions" },
		"avatar_id": { "type": ["string", "null"] },
		"agent_type": { "$ref": "#/$defs/AgentType" },
		"model": { "anyOf": [{ "$ref": "#/$defs/AgentModelSnapshot" }, { "type": "null" }] },
		"preferences": { "$ref": "#/$defs/AgentPreferences" }
	},
	"additionalProperties": false,
	"required": [
		"agent_id",
		"revision",
		"display_name",
		"introduction",
		"gender_description",
		"address_terms",
		"language_style",
		"skill",
		"dimensions",
		"avatar_id",
		"agent_type",
		"model",
		"preferences"
	]
};
var schema70 = {
	"type": "string",
	"enum": ["social", "tool"]
};
var schema74 = {
	"type": "string",
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	]
};
var schema76 = {
	"type": "string",
	"enum": ["off", "enabled"]
};
function validate50(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate50.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate50.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "temperature" || key0 === "top_p" || key0 === "max_output_tokens" || key0 === "input_budget" || key0 === "reasoning")) {
				validate50.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.temperature !== void 0) {
				let data0 = data.temperature;
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 2 || isNaN(data0)) {
						validate50.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 2
							},
							message: "must be <= 2"
						}];
						return false;
					} else if (data0 < 0 || isNaN(data0)) {
						validate50.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: 0
							},
							message: "must be >= 0"
						}];
						return false;
					}
				} else {
					validate50.errors = [{
						instancePath: instancePath + "/temperature",
						schemaPath: "#/properties/temperature/type",
						keyword: "type",
						params: { type: "number" },
						message: "must be number"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.top_p !== void 0) {
					let data1 = data.top_p;
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 1 || isNaN(data1)) {
							validate50.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 1
								},
								message: "must be <= 1"
							}];
							return false;
						} else if (data1 < 0 || isNaN(data1)) {
							validate50.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/minimum",
								keyword: "minimum",
								params: {
									comparison: ">=",
									limit: 0
								},
								message: "must be >= 0"
							}];
							return false;
						}
					} else {
						validate50.errors = [{
							instancePath: instancePath + "/top_p",
							schemaPath: "#/properties/top_p/type",
							keyword: "type",
							params: { type: "number" },
							message: "must be number"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.max_output_tokens !== void 0) {
						let data2 = data.max_output_tokens;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate50.errors = [{
								instancePath: instancePath + "/max_output_tokens",
								schemaPath: "#/properties/max_output_tokens/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 32768 || isNaN(data2)) {
								validate50.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 32768
									},
									message: "must be <= 32768"
								}];
								return false;
							} else if (data2 < 1 || isNaN(data2)) {
								validate50.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 1
									},
									message: "must be >= 1"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.input_budget !== void 0) {
							let data3 = data.input_budget;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
								validate50.errors = [{
									instancePath: instancePath + "/input_budget",
									schemaPath: "#/properties/input_budget/type",
									keyword: "type",
									params: { type: "integer" },
									message: "must be integer"
								}];
								return false;
							}
							if (typeof data3 == "number" && isFinite(data3)) {
								if (data3 > 128e3 || isNaN(data3)) {
									validate50.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 128e3
										},
										message: "must be <= 128000"
									}];
									return false;
								} else if (data3 < 256 || isNaN(data3)) {
									validate50.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: 256
										},
										message: "must be >= 256"
									}];
									return false;
								}
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.reasoning !== void 0) {
								let data4 = data.reasoning;
								if (typeof data4 !== "string") {
									validate50.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "off" || data4 === "enabled")) {
									validate50.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/enum",
										keyword: "enum",
										params: { allowedValues: schema76.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate50.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate50.errors = vErrors;
	return true;
}
validate50.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate49(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate49.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters")) {
				validate49.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "protocol" || key0 === "base_url" || key0 === "model_name" || key0 === "parameters")) {
					validate49.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.id !== void 0) {
						const _errs2 = errors;
						if (typeof data.id !== "string") {
							validate49.errors = [{
								instancePath: instancePath + "/id",
								schemaPath: "#/properties/id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.name !== void 0) {
							let data1 = data.name;
							const _errs4 = errors;
							if (errors === _errs4) {
								if (typeof data1 === "string") {
									if (func2(data1) > 80) {
										validate49.errors = [{
											instancePath: instancePath + "/name",
											schemaPath: "#/properties/name/maxLength",
											keyword: "maxLength",
											params: { limit: 80 },
											message: "must NOT have more than 80 characters"
										}];
										return false;
									} else if (func2(data1) < 1) {
										validate49.errors = [{
											instancePath: instancePath + "/name",
											schemaPath: "#/properties/name/minLength",
											keyword: "minLength",
											params: { limit: 1 },
											message: "must NOT have fewer than 1 characters"
										}];
										return false;
									}
								} else {
									validate49.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.protocol !== void 0) {
								let data2 = data.protocol;
								const _errs6 = errors;
								if (typeof data2 !== "string") {
									validate49.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data2 === "openai_chat_completions" || data2 === "anthropic_messages" || data2 === "openai_responses")) {
									validate49.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema74.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.base_url !== void 0) {
									let data3 = data.base_url;
									const _errs9 = errors;
									if (errors === _errs9) {
										if (typeof data3 === "string") {
											if (func2(data3) > 2048) {
												validate49.errors = [{
													instancePath: instancePath + "/base_url",
													schemaPath: "#/properties/base_url/maxLength",
													keyword: "maxLength",
													params: { limit: 2048 },
													message: "must NOT have more than 2048 characters"
												}];
												return false;
											} else if (func2(data3) < 1) {
												validate49.errors = [{
													instancePath: instancePath + "/base_url",
													schemaPath: "#/properties/base_url/minLength",
													keyword: "minLength",
													params: { limit: 1 },
													message: "must NOT have fewer than 1 characters"
												}];
												return false;
											}
										} else {
											validate49.errors = [{
												instancePath: instancePath + "/base_url",
												schemaPath: "#/properties/base_url/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.model_name !== void 0) {
										let data4 = data.model_name;
										const _errs11 = errors;
										if (errors === _errs11) {
											if (typeof data4 === "string") {
												if (func2(data4) > 200) {
													validate49.errors = [{
														instancePath: instancePath + "/model_name",
														schemaPath: "#/properties/model_name/maxLength",
														keyword: "maxLength",
														params: { limit: 200 },
														message: "must NOT have more than 200 characters"
													}];
													return false;
												} else if (func2(data4) < 1) {
													validate49.errors = [{
														instancePath: instancePath + "/model_name",
														schemaPath: "#/properties/model_name/minLength",
														keyword: "minLength",
														params: { limit: 1 },
														message: "must NOT have fewer than 1 characters"
													}];
													return false;
												}
											} else {
												validate49.errors = [{
													instancePath: instancePath + "/model_name",
													schemaPath: "#/properties/model_name/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.parameters !== void 0) {
											const _errs13 = errors;
											if (!validate50(data.parameters, {
												instancePath: instancePath + "/parameters",
												parentData: data,
												parentDataProperty: "parameters",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate50.errors : vErrors.concat(validate50.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate49.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate49.errors = vErrors;
	return errors === 0;
}
validate49.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate48(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate48.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.source_profile_id === void 0 && (missing0 = "source_profile_id") || data.source_profile_revision === void 0 && (missing0 = "source_profile_revision") || data.profile === void 0 && (missing0 = "profile")) {
				validate48.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "source_profile_id" || key0 === "source_profile_revision" || key0 === "profile")) {
					validate48.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.source_profile_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.source_profile_id !== "string") {
							validate48.errors = [{
								instancePath: instancePath + "/source_profile_id",
								schemaPath: "#/properties/source_profile_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.source_profile_revision !== void 0) {
							let data1 = data.source_profile_revision;
							const _errs4 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										validate48.errors = [{
											instancePath: instancePath + "/source_profile_revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data1)) {
										validate48.errors = [{
											instancePath: instancePath + "/source_profile_revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate48.errors = [{
										instancePath: instancePath + "/source_profile_revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.profile !== void 0) {
								const _errs7 = errors;
								if (!validate49(data.profile, {
									instancePath: instancePath + "/profile",
									parentData: data,
									parentDataProperty: "profile",
									rootData,
									dynamicAnchors
								})) {
									vErrors = vErrors === null ? validate49.errors : vErrors.concat(validate49.errors);
									errors = vErrors.length;
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
						}
					}
				}
			}
		} else {
			validate48.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate48.errors = vErrors;
	return errors === 0;
}
validate48.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate47(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate47.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.agent_id === void 0 && (missing0 = "agent_id") || data.revision === void 0 && (missing0 = "revision") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.gender_description === void 0 && (missing0 = "gender_description") || data.address_terms === void 0 && (missing0 = "address_terms") || data.language_style === void 0 && (missing0 = "language_style") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.agent_type === void 0 && (missing0 = "agent_type") || data.model === void 0 && (missing0 = "model") || data.preferences === void 0 && (missing0 = "preferences")) {
				validate47.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema67.properties, key0)) {
					validate47.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.agent_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.agent_id !== "string") {
							validate47.errors = [{
								instancePath: instancePath + "/agent_id",
								schemaPath: "#/properties/agent_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.revision !== void 0) {
							let data1 = data.revision;
							const _errs4 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										validate47.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data1)) {
										validate47.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate47.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.display_name !== void 0) {
								const _errs7 = errors;
								if (typeof data.display_name !== "string") {
									validate47.errors = [{
										instancePath: instancePath + "/display_name",
										schemaPath: "#/properties/display_name/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.introduction !== void 0) {
									const _errs9 = errors;
									if (typeof data.introduction !== "string") {
										validate47.errors = [{
											instancePath: instancePath + "/introduction",
											schemaPath: "#/properties/introduction/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.gender_description !== void 0) {
										let data4 = data.gender_description;
										const _errs11 = errors;
										if (typeof data4 !== "string" && data4 !== null) {
											validate47.errors = [{
												instancePath: instancePath + "/gender_description",
												schemaPath: "#/properties/gender_description/type",
												keyword: "type",
												params: { type: schema67.properties.gender_description.type },
												message: "must be string,null"
											}];
											return false;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.address_terms !== void 0) {
											let data5 = data.address_terms;
											const _errs13 = errors;
											if (errors === _errs13) {
												if (Array.isArray(data5)) {
													const len0 = data5.length;
													for (let i0 = 0; i0 < len0; i0++) {
														const _errs15 = errors;
														if (typeof data5[i0] !== "string") {
															validate47.errors = [{
																instancePath: instancePath + "/address_terms/" + i0,
																schemaPath: "#/properties/address_terms/items/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
														if (!(_errs15 === errors)) break;
													}
												} else {
													validate47.errors = [{
														instancePath: instancePath + "/address_terms",
														schemaPath: "#/properties/address_terms/type",
														keyword: "type",
														params: { type: "array" },
														message: "must be array"
													}];
													return false;
												}
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.language_style !== void 0) {
												const _errs17 = errors;
												if (typeof data.language_style !== "string") {
													validate47.errors = [{
														instancePath: instancePath + "/language_style",
														schemaPath: "#/properties/language_style/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												var valid0 = _errs17 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.skill !== void 0) {
													const _errs19 = errors;
													if (typeof data.skill !== "string") {
														validate47.errors = [{
															instancePath: instancePath + "/skill",
															schemaPath: "#/properties/skill/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
													var valid0 = _errs19 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.dimensions !== void 0) {
														let data9 = data.dimensions;
														const _errs21 = errors;
														if (errors === errors) {
															if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
																let missing1;
																if (data9.professional === void 0 && (missing1 = "professional") || data9.formal === void 0 && (missing1 = "formal") || data9.casual === void 0 && (missing1 = "casual") || data9.humor === void 0 && (missing1 = "humor") || data9.direct === void 0 && (missing1 = "direct") || data9.empathy === void 0 && (missing1 = "empathy") || data9.social_energy === void 0 && (missing1 = "social_energy")) {
																	validate47.errors = [{
																		instancePath: instancePath + "/dimensions",
																		schemaPath: "#/$defs/PersonaDimensions/required",
																		keyword: "required",
																		params: { missingProperty: missing1 },
																		message: "must have required property '" + missing1 + "'"
																	}];
																	return false;
																} else {
																	const _errs24 = errors;
																	for (const key1 in data9) if (!(key1 === "professional" || key1 === "formal" || key1 === "casual" || key1 === "humor" || key1 === "direct" || key1 === "empathy" || key1 === "social_energy")) {
																		validate47.errors = [{
																			instancePath: instancePath + "/dimensions",
																			schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
																			keyword: "additionalProperties",
																			params: { additionalProperty: key1 },
																			message: "must NOT have additional properties"
																		}];
																		return false;
																	}
																	if (_errs24 === errors) {
																		if (data9.professional !== void 0) {
																			let data10 = data9.professional;
																			const _errs25 = errors;
																			if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																				validate47.errors = [{
																					instancePath: instancePath + "/dimensions/professional",
																					schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
																					keyword: "type",
																					params: { type: "integer" },
																					message: "must be integer"
																				}];
																				return false;
																			}
																			if (errors === _errs25) {
																				if (typeof data10 == "number" && isFinite(data10)) {
																					if (data10 > 100 || isNaN(data10)) {
																						validate47.errors = [{
																							instancePath: instancePath + "/dimensions/professional",
																							schemaPath: "#/$defs/PersonaDimensions/properties/professional/maximum",
																							keyword: "maximum",
																							params: {
																								comparison: "<=",
																								limit: 100
																							},
																							message: "must be <= 100"
																						}];
																						return false;
																					} else if (data10 < 0 || isNaN(data10)) {
																						validate47.errors = [{
																							instancePath: instancePath + "/dimensions/professional",
																							schemaPath: "#/$defs/PersonaDimensions/properties/professional/minimum",
																							keyword: "minimum",
																							params: {
																								comparison: ">=",
																								limit: 0
																							},
																							message: "must be >= 0"
																						}];
																						return false;
																					}
																				}
																			}
																			var valid4 = _errs25 === errors;
																		} else var valid4 = true;
																		if (valid4) {
																			if (data9.formal !== void 0) {
																				let data11 = data9.formal;
																				const _errs27 = errors;
																				if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																					validate47.errors = [{
																						instancePath: instancePath + "/dimensions/formal",
																						schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
																						keyword: "type",
																						params: { type: "integer" },
																						message: "must be integer"
																					}];
																					return false;
																				}
																				if (errors === _errs27) {
																					if (typeof data11 == "number" && isFinite(data11)) {
																						if (data11 > 100 || isNaN(data11)) {
																							validate47.errors = [{
																								instancePath: instancePath + "/dimensions/formal",
																								schemaPath: "#/$defs/PersonaDimensions/properties/formal/maximum",
																								keyword: "maximum",
																								params: {
																									comparison: "<=",
																									limit: 100
																								},
																								message: "must be <= 100"
																							}];
																							return false;
																						} else if (data11 < 0 || isNaN(data11)) {
																							validate47.errors = [{
																								instancePath: instancePath + "/dimensions/formal",
																								schemaPath: "#/$defs/PersonaDimensions/properties/formal/minimum",
																								keyword: "minimum",
																								params: {
																									comparison: ">=",
																									limit: 0
																								},
																								message: "must be >= 0"
																							}];
																							return false;
																						}
																					}
																				}
																				var valid4 = _errs27 === errors;
																			} else var valid4 = true;
																			if (valid4) {
																				if (data9.casual !== void 0) {
																					let data12 = data9.casual;
																					const _errs29 = errors;
																					if (!(typeof data12 == "number" && !(data12 % 1) && !isNaN(data12) && isFinite(data12))) {
																						validate47.errors = [{
																							instancePath: instancePath + "/dimensions/casual",
																							schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																							keyword: "type",
																							params: { type: "integer" },
																							message: "must be integer"
																						}];
																						return false;
																					}
																					if (errors === _errs29) {
																						if (typeof data12 == "number" && isFinite(data12)) {
																							if (data12 > 100 || isNaN(data12)) {
																								validate47.errors = [{
																									instancePath: instancePath + "/dimensions/casual",
																									schemaPath: "#/$defs/PersonaDimensions/properties/casual/maximum",
																									keyword: "maximum",
																									params: {
																										comparison: "<=",
																										limit: 100
																									},
																									message: "must be <= 100"
																								}];
																								return false;
																							} else if (data12 < 0 || isNaN(data12)) {
																								validate47.errors = [{
																									instancePath: instancePath + "/dimensions/casual",
																									schemaPath: "#/$defs/PersonaDimensions/properties/casual/minimum",
																									keyword: "minimum",
																									params: {
																										comparison: ">=",
																										limit: 0
																									},
																									message: "must be >= 0"
																								}];
																								return false;
																							}
																						}
																					}
																					var valid4 = _errs29 === errors;
																				} else var valid4 = true;
																				if (valid4) {
																					if (data9.humor !== void 0) {
																						let data13 = data9.humor;
																						const _errs31 = errors;
																						if (!(typeof data13 == "number" && !(data13 % 1) && !isNaN(data13) && isFinite(data13))) {
																							validate47.errors = [{
																								instancePath: instancePath + "/dimensions/humor",
																								schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
																								keyword: "type",
																								params: { type: "integer" },
																								message: "must be integer"
																							}];
																							return false;
																						}
																						if (errors === _errs31) {
																							if (typeof data13 == "number" && isFinite(data13)) {
																								if (data13 > 100 || isNaN(data13)) {
																									validate47.errors = [{
																										instancePath: instancePath + "/dimensions/humor",
																										schemaPath: "#/$defs/PersonaDimensions/properties/humor/maximum",
																										keyword: "maximum",
																										params: {
																											comparison: "<=",
																											limit: 100
																										},
																										message: "must be <= 100"
																									}];
																									return false;
																								} else if (data13 < 0 || isNaN(data13)) {
																									validate47.errors = [{
																										instancePath: instancePath + "/dimensions/humor",
																										schemaPath: "#/$defs/PersonaDimensions/properties/humor/minimum",
																										keyword: "minimum",
																										params: {
																											comparison: ">=",
																											limit: 0
																										},
																										message: "must be >= 0"
																									}];
																									return false;
																								}
																							}
																						}
																						var valid4 = _errs31 === errors;
																					} else var valid4 = true;
																					if (valid4) {
																						if (data9.direct !== void 0) {
																							let data14 = data9.direct;
																							const _errs33 = errors;
																							if (!(typeof data14 == "number" && !(data14 % 1) && !isNaN(data14) && isFinite(data14))) {
																								validate47.errors = [{
																									instancePath: instancePath + "/dimensions/direct",
																									schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																									keyword: "type",
																									params: { type: "integer" },
																									message: "must be integer"
																								}];
																								return false;
																							}
																							if (errors === _errs33) {
																								if (typeof data14 == "number" && isFinite(data14)) {
																									if (data14 > 100 || isNaN(data14)) {
																										validate47.errors = [{
																											instancePath: instancePath + "/dimensions/direct",
																											schemaPath: "#/$defs/PersonaDimensions/properties/direct/maximum",
																											keyword: "maximum",
																											params: {
																												comparison: "<=",
																												limit: 100
																											},
																											message: "must be <= 100"
																										}];
																										return false;
																									} else if (data14 < 0 || isNaN(data14)) {
																										validate47.errors = [{
																											instancePath: instancePath + "/dimensions/direct",
																											schemaPath: "#/$defs/PersonaDimensions/properties/direct/minimum",
																											keyword: "minimum",
																											params: {
																												comparison: ">=",
																												limit: 0
																											},
																											message: "must be >= 0"
																										}];
																										return false;
																									}
																								}
																							}
																							var valid4 = _errs33 === errors;
																						} else var valid4 = true;
																						if (valid4) {
																							if (data9.empathy !== void 0) {
																								let data15 = data9.empathy;
																								const _errs35 = errors;
																								if (!(typeof data15 == "number" && !(data15 % 1) && !isNaN(data15) && isFinite(data15))) {
																									validate47.errors = [{
																										instancePath: instancePath + "/dimensions/empathy",
																										schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																										keyword: "type",
																										params: { type: "integer" },
																										message: "must be integer"
																									}];
																									return false;
																								}
																								if (errors === _errs35) {
																									if (typeof data15 == "number" && isFinite(data15)) {
																										if (data15 > 100 || isNaN(data15)) {
																											validate47.errors = [{
																												instancePath: instancePath + "/dimensions/empathy",
																												schemaPath: "#/$defs/PersonaDimensions/properties/empathy/maximum",
																												keyword: "maximum",
																												params: {
																													comparison: "<=",
																													limit: 100
																												},
																												message: "must be <= 100"
																											}];
																											return false;
																										} else if (data15 < 0 || isNaN(data15)) {
																											validate47.errors = [{
																												instancePath: instancePath + "/dimensions/empathy",
																												schemaPath: "#/$defs/PersonaDimensions/properties/empathy/minimum",
																												keyword: "minimum",
																												params: {
																													comparison: ">=",
																													limit: 0
																												},
																												message: "must be >= 0"
																											}];
																											return false;
																										}
																									}
																								}
																								var valid4 = _errs35 === errors;
																							} else var valid4 = true;
																							if (valid4) {
																								if (data9.social_energy !== void 0) {
																									let data16 = data9.social_energy;
																									const _errs37 = errors;
																									if (!(typeof data16 == "number" && !(data16 % 1) && !isNaN(data16) && isFinite(data16))) {
																										validate47.errors = [{
																											instancePath: instancePath + "/dimensions/social_energy",
																											schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																											keyword: "type",
																											params: { type: "integer" },
																											message: "must be integer"
																										}];
																										return false;
																									}
																									if (errors === _errs37) {
																										if (typeof data16 == "number" && isFinite(data16)) {
																											if (data16 > 100 || isNaN(data16)) {
																												validate47.errors = [{
																													instancePath: instancePath + "/dimensions/social_energy",
																													schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/maximum",
																													keyword: "maximum",
																													params: {
																														comparison: "<=",
																														limit: 100
																													},
																													message: "must be <= 100"
																												}];
																												return false;
																											} else if (data16 < 0 || isNaN(data16)) {
																												validate47.errors = [{
																													instancePath: instancePath + "/dimensions/social_energy",
																													schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/minimum",
																													keyword: "minimum",
																													params: {
																														comparison: ">=",
																														limit: 0
																													},
																													message: "must be >= 0"
																												}];
																												return false;
																											}
																										}
																									}
																									var valid4 = _errs37 === errors;
																								} else var valid4 = true;
																							}
																						}
																					}
																				}
																			}
																		}
																	}
																}
															} else {
																validate47.errors = [{
																	instancePath: instancePath + "/dimensions",
																	schemaPath: "#/$defs/PersonaDimensions/type",
																	keyword: "type",
																	params: { type: "object" },
																	message: "must be object"
																}];
																return false;
															}
														}
														var valid0 = _errs21 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.avatar_id !== void 0) {
															let data17 = data.avatar_id;
															const _errs39 = errors;
															if (typeof data17 !== "string" && data17 !== null) {
																validate47.errors = [{
																	instancePath: instancePath + "/avatar_id",
																	schemaPath: "#/properties/avatar_id/type",
																	keyword: "type",
																	params: { type: schema67.properties.avatar_id.type },
																	message: "must be string,null"
																}];
																return false;
															}
															var valid0 = _errs39 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.agent_type !== void 0) {
																let data18 = data.agent_type;
																const _errs41 = errors;
																if (typeof data18 !== "string") {
																	validate47.errors = [{
																		instancePath: instancePath + "/agent_type",
																		schemaPath: "#/$defs/AgentType/type",
																		keyword: "type",
																		params: { type: "string" },
																		message: "must be string"
																	}];
																	return false;
																}
																if (!(data18 === "social" || data18 === "tool")) {
																	validate47.errors = [{
																		instancePath: instancePath + "/agent_type",
																		schemaPath: "#/$defs/AgentType/enum",
																		keyword: "enum",
																		params: { allowedValues: schema70.enum },
																		message: "must be equal to one of the allowed values"
																	}];
																	return false;
																}
																var valid0 = _errs41 === errors;
															} else var valid0 = true;
															if (valid0) {
																if (data.model !== void 0) {
																	let data19 = data.model;
																	const _errs44 = errors;
																	const _errs45 = errors;
																	let valid6 = false;
																	const _errs46 = errors;
																	if (!validate48(data19, {
																		instancePath: instancePath + "/model",
																		parentData: data,
																		parentDataProperty: "model",
																		rootData,
																		dynamicAnchors
																	})) {
																		vErrors = vErrors === null ? validate48.errors : vErrors.concat(validate48.errors);
																		errors = vErrors.length;
																	}
																	var _valid0 = _errs46 === errors;
																	valid6 = valid6 || _valid0;
																	const _errs47 = errors;
																	if (data19 !== null) {
																		const err0 = {
																			instancePath: instancePath + "/model",
																			schemaPath: "#/properties/model/anyOf/1/type",
																			keyword: "type",
																			params: { type: "null" },
																			message: "must be null"
																		};
																		if (vErrors === null) vErrors = [err0];
																		else vErrors.push(err0);
																		errors++;
																	}
																	var _valid0 = _errs47 === errors;
																	valid6 = valid6 || _valid0;
																	if (!valid6) {
																		const err1 = {
																			instancePath: instancePath + "/model",
																			schemaPath: "#/properties/model/anyOf",
																			keyword: "anyOf",
																			params: {},
																			message: "must match a schema in anyOf"
																		};
																		if (vErrors === null) vErrors = [err1];
																		else vErrors.push(err1);
																		errors++;
																		validate47.errors = vErrors;
																		return false;
																	} else {
																		errors = _errs45;
																		if (vErrors !== null) {
																			if (_errs45) vErrors.length = _errs45;
																			else vErrors = null;
																		}
																	}
																	var valid0 = _errs44 === errors;
																} else var valid0 = true;
																if (valid0) {
																	if (data.preferences !== void 0) {
																		let data20 = data.preferences;
																		const _errs49 = errors;
																		if (errors === errors) {
																			if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
																				let missing2;
																				if (data20.request_limit_daily === void 0 && (missing2 = "request_limit_daily") || data20.persistent_memory === void 0 && (missing2 = "persistent_memory") || data20.allow_autonomous_wake === void 0 && (missing2 = "allow_autonomous_wake")) {
																					validate47.errors = [{
																						instancePath: instancePath + "/preferences",
																						schemaPath: "#/$defs/AgentPreferences/required",
																						keyword: "required",
																						params: { missingProperty: missing2 },
																						message: "must have required property '" + missing2 + "'"
																					}];
																					return false;
																				} else {
																					const _errs52 = errors;
																					for (const key2 in data20) if (!(key2 === "request_limit_daily" || key2 === "persistent_memory" || key2 === "allow_autonomous_wake")) {
																						validate47.errors = [{
																							instancePath: instancePath + "/preferences",
																							schemaPath: "#/$defs/AgentPreferences/additionalProperties",
																							keyword: "additionalProperties",
																							params: { additionalProperty: key2 },
																							message: "must NOT have additional properties"
																						}];
																						return false;
																					}
																					if (_errs52 === errors) {
																						if (data20.request_limit_daily !== void 0) {
																							let data21 = data20.request_limit_daily;
																							const _errs53 = errors;
																							if (!(typeof data21 == "number" && !(data21 % 1) && !isNaN(data21) && isFinite(data21))) {
																								validate47.errors = [{
																									instancePath: instancePath + "/preferences/request_limit_daily",
																									schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/type",
																									keyword: "type",
																									params: { type: "integer" },
																									message: "must be integer"
																								}];
																								return false;
																							}
																							if (errors === _errs53) {
																								if (typeof data21 == "number" && isFinite(data21)) {
																									if (data21 > 5e3 || isNaN(data21)) {
																										validate47.errors = [{
																											instancePath: instancePath + "/preferences/request_limit_daily",
																											schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/maximum",
																											keyword: "maximum",
																											params: {
																												comparison: "<=",
																												limit: 5e3
																											},
																											message: "must be <= 5000"
																										}];
																										return false;
																									} else if (data21 < 1 || isNaN(data21)) {
																										validate47.errors = [{
																											instancePath: instancePath + "/preferences/request_limit_daily",
																											schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/minimum",
																											keyword: "minimum",
																											params: {
																												comparison: ">=",
																												limit: 1
																											},
																											message: "must be >= 1"
																										}];
																										return false;
																									}
																								}
																							}
																							var valid8 = _errs53 === errors;
																						} else var valid8 = true;
																						if (valid8) {
																							if (data20.persistent_memory !== void 0) {
																								const _errs55 = errors;
																								if (typeof data20.persistent_memory !== "boolean") {
																									validate47.errors = [{
																										instancePath: instancePath + "/preferences/persistent_memory",
																										schemaPath: "#/$defs/AgentPreferences/properties/persistent_memory/type",
																										keyword: "type",
																										params: { type: "boolean" },
																										message: "must be boolean"
																									}];
																									return false;
																								}
																								var valid8 = _errs55 === errors;
																							} else var valid8 = true;
																							if (valid8) {
																								if (data20.allow_autonomous_wake !== void 0) {
																									const _errs57 = errors;
																									if (typeof data20.allow_autonomous_wake !== "boolean") {
																										validate47.errors = [{
																											instancePath: instancePath + "/preferences/allow_autonomous_wake",
																											schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																											keyword: "type",
																											params: { type: "boolean" },
																											message: "must be boolean"
																										}];
																										return false;
																									}
																									var valid8 = _errs57 === errors;
																								} else var valid8 = true;
																							}
																						}
																					}
																				}
																			} else {
																				validate47.errors = [{
																					instancePath: instancePath + "/preferences",
																					schemaPath: "#/$defs/AgentPreferences/type",
																					keyword: "type",
																					params: { type: "object" },
																					message: "must be object"
																				}];
																				return false;
																			}
																		}
																		var valid0 = _errs49 === errors;
																	} else var valid0 = true;
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate47.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate47.errors = vErrors;
	return errors === 0;
}
validate47.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate46(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate46.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate46.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate46.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate46.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate46.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema66.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate47(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate47.errors : vErrors.concat(validate47.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate46.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate46.errors = vErrors;
	return errors === 0;
}
validate46.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema80 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema81 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema82 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate57(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate57.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate57.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate57.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate57.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate57.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema81.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate57.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate57.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate57.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema82.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate57.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema80.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate57.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate57.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate57.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate57.errors = vErrors;
	return true;
}
validate57.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate56(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate56.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate56.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate56.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate56.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate56.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema66.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate57(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate56.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate56.errors = vErrors;
	return errors === 0;
}
validate56.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate45(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate45.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate46(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate46.errors : vErrors.concat(validate46.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate56(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate45.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate45.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate45.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateAppSnapshotRequest = validate60;
var schema83 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"title": "AppSnapshotRequest",
	"type": "object",
	"properties": {
		"data_generation_id": {
			"type": ["string", "null"],
			"default": null
		},
		"last_event_seq": {
			"anyOf": [{ "$ref": "#/$defs/DecimalString" }, { "type": "null" }],
			"default": null
		}
	},
	"additionalProperties": false,
	"$defs": { "DecimalString": {
		"type": "string",
		"maxLength": 19,
		"pattern": "^(0|[1-9][0-9]*)$"
	} }
};
function validate60(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate60.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			const _errs1 = errors;
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "last_event_seq")) {
				validate60.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (_errs1 === errors) {
				if (data.data_generation_id !== void 0) {
					let data0 = data.data_generation_id;
					const _errs2 = errors;
					if (typeof data0 !== "string" && data0 !== null) {
						validate60.errors = [{
							instancePath: instancePath + "/data_generation_id",
							schemaPath: "#/properties/data_generation_id/type",
							keyword: "type",
							params: { type: schema83.properties.data_generation_id.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = _errs2 === errors;
				} else var valid0 = true;
				if (valid0) {
					if (data.last_event_seq !== void 0) {
						let data1 = data.last_event_seq;
						const _errs4 = errors;
						const _errs5 = errors;
						let valid1 = false;
						const _errs6 = errors;
						if (errors === errors) {
							if (typeof data1 === "string") {
								if (func2(data1) > 19) {
									const err0 = {
										instancePath: instancePath + "/last_event_seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									};
									if (vErrors === null) vErrors = [err0];
									else vErrors.push(err0);
									errors++;
								} else if (!pattern4.test(data1)) {
									const err1 = {
										instancePath: instancePath + "/last_event_seq",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									};
									if (vErrors === null) vErrors = [err1];
									else vErrors.push(err1);
									errors++;
								}
							} else {
								const err2 = {
									instancePath: instancePath + "/last_event_seq",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err2];
								else vErrors.push(err2);
								errors++;
							}
						}
						var _valid0 = _errs6 === errors;
						valid1 = valid1 || _valid0;
						const _errs9 = errors;
						if (data1 !== null) {
							const err3 = {
								instancePath: instancePath + "/last_event_seq",
								schemaPath: "#/properties/last_event_seq/anyOf/1/type",
								keyword: "type",
								params: { type: "null" },
								message: "must be null"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var _valid0 = _errs9 === errors;
						valid1 = valid1 || _valid0;
						if (!valid1) {
							const err4 = {
								instancePath: instancePath + "/last_event_seq",
								schemaPath: "#/properties/last_event_seq/anyOf",
								keyword: "anyOf",
								params: {},
								message: "must match a schema in anyOf"
							};
							if (vErrors === null) vErrors = [err4];
							else vErrors.push(err4);
							errors++;
							validate60.errors = vErrors;
							return false;
						} else {
							errors = _errs5;
							if (vErrors !== null) {
								if (_errs5) vErrors.length = _errs5;
								else vErrors = null;
							}
						}
						var valid0 = _errs4 === errors;
					} else var valid0 = true;
				}
			}
		} else {
			validate60.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate60.errors = vErrors;
	return errors === 0;
}
validate60.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateAppSnapshotResponse = validate61;
var schema87 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema88 = {
	"type": "object",
	"properties": {
		"data_generation_id": { "type": "string" },
		"room": { "$ref": "#/$defs/Room" },
		"local_user": { "$ref": "#/$defs/Participant" },
		"participants": {
			"type": "array",
			"items": { "$ref": "#/$defs/Participant" }
		},
		"appearance": { "$ref": "#/$defs/Appearance" },
		"latest_message_seq": { "$ref": "#/$defs/DecimalString" },
		"latest_event_seq": { "$ref": "#/$defs/DecimalString" },
		"events": {
			"type": "array",
			"items": { "$ref": "#/$defs/DomainEvent" }
		},
		"requires_full_reload": { "type": "boolean" },
		"data_directory": { "type": "string" },
		"data_usage": { "$ref": "#/$defs/DataUsage" },
		"app_version": { "type": "string" },
		"development_tools_available": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"data_generation_id",
		"room",
		"local_user",
		"participants",
		"appearance",
		"latest_message_seq",
		"latest_event_seq",
		"events",
		"requires_full_reload",
		"data_directory",
		"data_usage",
		"app_version",
		"development_tools_available"
	]
};
function validate64(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate64.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.owner_participant_id === void 0 && (missing0 = "owner_participant_id") || data.version === void 0 && (missing0 = "version") || data.content_epoch === void 0 && (missing0 = "content_epoch")) {
			validate64.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "owner_participant_id" || key0 === "version" || key0 === "content_epoch")) {
				validate64.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.id !== void 0) {
				if (typeof data.id !== "string") {
					validate64.errors = [{
						instancePath: instancePath + "/id",
						schemaPath: "#/properties/id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.name !== void 0) {
					if (typeof data.name !== "string") {
						validate64.errors = [{
							instancePath: instancePath + "/name",
							schemaPath: "#/properties/name/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.owner_participant_id !== void 0) {
						if (typeof data.owner_participant_id !== "string") {
							validate64.errors = [{
								instancePath: instancePath + "/owner_participant_id",
								schemaPath: "#/properties/owner_participant_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.version !== void 0) {
							let data3 = data.version;
							if (typeof data3 === "string") {
								if (func2(data3) > 19) {
									validate64.errors = [{
										instancePath: instancePath + "/version",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									}];
									return false;
								} else if (!pattern4.test(data3)) {
									validate64.errors = [{
										instancePath: instancePath + "/version",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									}];
									return false;
								}
							} else {
								validate64.errors = [{
									instancePath: instancePath + "/version",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.content_epoch !== void 0) {
								let data4 = data.content_epoch;
								if (typeof data4 === "string") {
									if (func2(data4) > 19) {
										validate64.errors = [{
											instancePath: instancePath + "/content_epoch",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data4)) {
										validate64.errors = [{
											instancePath: instancePath + "/content_epoch",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate64.errors = [{
										instancePath: instancePath + "/content_epoch",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate64.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate64.errors = vErrors;
	return true;
}
validate64.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema92 = {
	"type": "object",
	"properties": {
		"id": { "type": "string" },
		"kind": { "$ref": "#/$defs/ParticipantKind" },
		"display_name": { "type": "string" },
		"introduction": { "type": "string" },
		"status": { "$ref": "#/$defs/ParticipantStatus" },
		"is_builtin": { "type": "boolean" },
		"avatar_id": {
			"type": ["string", "null"],
			"default": null
		},
		"profile_revision": {
			"$ref": "#/$defs/DecimalString",
			"default": "1"
		}
	},
	"additionalProperties": false,
	"required": [
		"id",
		"kind",
		"display_name",
		"introduction",
		"status",
		"is_builtin",
		"avatar_id",
		"profile_revision"
	]
};
var schema93 = {
	"type": "string",
	"enum": ["user", "agent"]
};
var schema94 = {
	"type": "string",
	"enum": ["present", "needs_configuration"]
};
function validate66(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate66.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.kind === void 0 && (missing0 = "kind") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.status === void 0 && (missing0 = "status") || data.is_builtin === void 0 && (missing0 = "is_builtin") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.profile_revision === void 0 && (missing0 = "profile_revision")) {
			validate66.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "id" || key0 === "kind" || key0 === "display_name" || key0 === "introduction" || key0 === "status" || key0 === "is_builtin" || key0 === "avatar_id" || key0 === "profile_revision")) {
				validate66.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.id !== void 0) {
				if (typeof data.id !== "string") {
					validate66.errors = [{
						instancePath: instancePath + "/id",
						schemaPath: "#/properties/id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.kind !== void 0) {
					let data1 = data.kind;
					if (typeof data1 !== "string") {
						validate66.errors = [{
							instancePath: instancePath + "/kind",
							schemaPath: "#/$defs/ParticipantKind/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data1 === "user" || data1 === "agent")) {
						validate66.errors = [{
							instancePath: instancePath + "/kind",
							schemaPath: "#/$defs/ParticipantKind/enum",
							keyword: "enum",
							params: { allowedValues: schema93.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.display_name !== void 0) {
						if (typeof data.display_name !== "string") {
							validate66.errors = [{
								instancePath: instancePath + "/display_name",
								schemaPath: "#/properties/display_name/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.introduction !== void 0) {
							if (typeof data.introduction !== "string") {
								validate66.errors = [{
									instancePath: instancePath + "/introduction",
									schemaPath: "#/properties/introduction/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.status !== void 0) {
								let data4 = data.status;
								if (typeof data4 !== "string") {
									validate66.errors = [{
										instancePath: instancePath + "/status",
										schemaPath: "#/$defs/ParticipantStatus/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "present" || data4 === "needs_configuration")) {
									validate66.errors = [{
										instancePath: instancePath + "/status",
										schemaPath: "#/$defs/ParticipantStatus/enum",
										keyword: "enum",
										params: { allowedValues: schema94.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.is_builtin !== void 0) {
									if (typeof data.is_builtin !== "boolean") {
										validate66.errors = [{
											instancePath: instancePath + "/is_builtin",
											schemaPath: "#/properties/is_builtin/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.avatar_id !== void 0) {
										let data6 = data.avatar_id;
										if (typeof data6 !== "string" && data6 !== null) {
											validate66.errors = [{
												instancePath: instancePath + "/avatar_id",
												schemaPath: "#/properties/avatar_id/type",
												keyword: "type",
												params: { type: schema92.properties.avatar_id.type },
												message: "must be string,null"
											}];
											return false;
										}
										var valid0 = true;
									} else var valid0 = true;
									if (valid0) {
										if (data.profile_revision !== void 0) {
											let data7 = data.profile_revision;
											if (typeof data7 === "string") {
												if (func2(data7) > 19) {
													validate66.errors = [{
														instancePath: instancePath + "/profile_revision",
														schemaPath: "#/$defs/DecimalString/maxLength",
														keyword: "maxLength",
														params: { limit: 19 },
														message: "must NOT have more than 19 characters"
													}];
													return false;
												} else if (!pattern4.test(data7)) {
													validate66.errors = [{
														instancePath: instancePath + "/profile_revision",
														schemaPath: "#/$defs/DecimalString/pattern",
														keyword: "pattern",
														params: { pattern: "^(0|[1-9][0-9]*)$" },
														message: "must match pattern \"^(0|[1-9][0-9]*)$\""
													}];
													return false;
												}
											} else {
												validate66.errors = [{
													instancePath: instancePath + "/profile_revision",
													schemaPath: "#/$defs/DecimalString/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											var valid0 = true;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate66.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate66.errors = vErrors;
	return true;
}
validate66.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema97 = {
	"type": "string",
	"enum": [
		"system",
		"light",
		"dark"
	]
};
function validate69(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate69.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion") || data.revision === void 0 && (missing0 = "revision")) {
			validate69.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "theme" || key0 === "reduce_motion" || key0 === "revision")) {
				validate69.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.theme !== void 0) {
				let data0 = data.theme;
				if (typeof data0 !== "string") {
					validate69.errors = [{
						instancePath: instancePath + "/theme",
						schemaPath: "#/$defs/Theme/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "system" || data0 === "light" || data0 === "dark")) {
					validate69.errors = [{
						instancePath: instancePath + "/theme",
						schemaPath: "#/$defs/Theme/enum",
						keyword: "enum",
						params: { allowedValues: schema97.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.reduce_motion !== void 0) {
					if (typeof data.reduce_motion !== "boolean") {
						validate69.errors = [{
							instancePath: instancePath + "/reduce_motion",
							schemaPath: "#/properties/reduce_motion/type",
							keyword: "type",
							params: { type: "boolean" },
							message: "must be boolean"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.revision !== void 0) {
						let data2 = data.revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate69.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate69.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate69.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate69.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate69.errors = vErrors;
	return true;
}
validate69.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate72(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate72.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	let passing0 = null;
	const _errs1 = errors;
	if (errors === _errs1) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.kind === void 0 && (missing0 = "kind") || data.message_id === void 0 && (missing0 = "message_id") || data.message_seq === void 0 && (missing0 = "message_seq") || data.sender_id === void 0 && (missing0 = "sender_id")) {
				const err0 = {
					instancePath,
					schemaPath: "#/oneOf/0/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				};
				if (vErrors === null) vErrors = [err0];
				else vErrors.push(err0);
				errors++;
			} else {
				const _errs3 = errors;
				for (const key0 in data) if (!(key0 === "kind" || key0 === "message_id" || key0 === "message_seq" || key0 === "sender_id")) {
					const err1 = {
						instancePath,
						schemaPath: "#/oneOf/0/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err1];
					else vErrors.push(err1);
					errors++;
					break;
				}
				if (_errs3 === errors) {
					if (data.kind !== void 0) {
						let data0 = data.kind;
						const _errs4 = errors;
						if (typeof data0 !== "string") {
							const err2 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err2];
							else vErrors.push(err2);
							errors++;
						}
						if ("message_committed" !== data0) {
							const err3 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "message_committed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var valid1 = _errs4 === errors;
					} else var valid1 = true;
					if (valid1) {
						if (data.message_id !== void 0) {
							const _errs6 = errors;
							if (typeof data.message_id !== "string") {
								const err4 = {
									instancePath: instancePath + "/message_id",
									schemaPath: "#/oneOf/0/properties/message_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
							}
							var valid1 = _errs6 === errors;
						} else var valid1 = true;
						if (valid1) {
							if (data.message_seq !== void 0) {
								let data2 = data.message_seq;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											const err5 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err5];
											else vErrors.push(err5);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err6 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err6];
											else vErrors.push(err6);
											errors++;
										}
									} else {
										const err7 = {
											instancePath: instancePath + "/message_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err7];
										else vErrors.push(err7);
										errors++;
									}
								}
								var valid1 = _errs8 === errors;
							} else var valid1 = true;
							if (valid1) {
								if (data.sender_id !== void 0) {
									const _errs11 = errors;
									if (typeof data.sender_id !== "string") {
										const err8 = {
											instancePath: instancePath + "/sender_id",
											schemaPath: "#/oneOf/0/properties/sender_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err8];
										else vErrors.push(err8);
										errors++;
									}
									var valid1 = _errs11 === errors;
								} else var valid1 = true;
							}
						}
					}
				}
			}
		} else {
			const err9 = {
				instancePath,
				schemaPath: "#/oneOf/0/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err9];
			else vErrors.push(err9);
			errors++;
		}
	}
	var _valid0 = _errs1 === errors;
	if (_valid0) {
		valid0 = true;
		passing0 = 0;
		var props0 = true;
	}
	const _errs13 = errors;
	if (errors === _errs13) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing1;
			if (data.kind === void 0 && (missing1 = "kind") || data.appearance === void 0 && (missing1 = "appearance")) {
				const err10 = {
					instancePath,
					schemaPath: "#/oneOf/1/required",
					keyword: "required",
					params: { missingProperty: missing1 },
					message: "must have required property '" + missing1 + "'"
				};
				if (vErrors === null) vErrors = [err10];
				else vErrors.push(err10);
				errors++;
			} else {
				const _errs15 = errors;
				for (const key1 in data) if (!(key1 === "kind" || key1 === "appearance")) {
					const err11 = {
						instancePath,
						schemaPath: "#/oneOf/1/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key1 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err11];
					else vErrors.push(err11);
					errors++;
					break;
				}
				if (_errs15 === errors) {
					if (data.kind !== void 0) {
						let data4 = data.kind;
						const _errs16 = errors;
						if (typeof data4 !== "string") {
							const err12 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/1/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err12];
							else vErrors.push(err12);
							errors++;
						}
						if ("appearance_changed" !== data4) {
							const err13 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/1/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "appearance_changed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err13];
							else vErrors.push(err13);
							errors++;
						}
						var valid3 = _errs16 === errors;
					} else var valid3 = true;
					if (valid3) {
						if (data.appearance !== void 0) {
							const _errs18 = errors;
							if (!validate69(data.appearance, {
								instancePath: instancePath + "/appearance",
								parentData: data,
								parentDataProperty: "appearance",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
								errors = vErrors.length;
							}
							var valid3 = _errs18 === errors;
						} else var valid3 = true;
					}
				}
			}
		} else {
			const err14 = {
				instancePath,
				schemaPath: "#/oneOf/1/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err14];
			else vErrors.push(err14);
			errors++;
		}
	}
	var _valid0 = _errs13 === errors;
	if (_valid0 && valid0) {
		valid0 = false;
		passing0 = [passing0, 1];
	} else {
		if (_valid0) {
			valid0 = true;
			passing0 = 1;
			if (props0 !== true) props0 = true;
		}
		const _errs19 = errors;
		if (errors === _errs19) {
			if (data && typeof data == "object" && !Array.isArray(data)) {
				let missing2;
				if (data.kind === void 0 && (missing2 = "kind") || data.participant === void 0 && (missing2 = "participant")) {
					const err15 = {
						instancePath,
						schemaPath: "#/oneOf/2/required",
						keyword: "required",
						params: { missingProperty: missing2 },
						message: "must have required property '" + missing2 + "'"
					};
					if (vErrors === null) vErrors = [err15];
					else vErrors.push(err15);
					errors++;
				} else {
					const _errs21 = errors;
					for (const key2 in data) if (!(key2 === "kind" || key2 === "participant")) {
						const err16 = {
							instancePath,
							schemaPath: "#/oneOf/2/additionalProperties",
							keyword: "additionalProperties",
							params: { additionalProperty: key2 },
							message: "must NOT have additional properties"
						};
						if (vErrors === null) vErrors = [err16];
						else vErrors.push(err16);
						errors++;
						break;
					}
					if (_errs21 === errors) {
						if (data.kind !== void 0) {
							let data6 = data.kind;
							const _errs22 = errors;
							if (typeof data6 !== "string") {
								const err17 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/2/properties/kind/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err17];
								else vErrors.push(err17);
								errors++;
							}
							if ("participant_profile_changed" !== data6) {
								const err18 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/2/properties/kind/const",
									keyword: "const",
									params: { allowedValue: "participant_profile_changed" },
									message: "must be equal to constant"
								};
								if (vErrors === null) vErrors = [err18];
								else vErrors.push(err18);
								errors++;
							}
							var valid4 = _errs22 === errors;
						} else var valid4 = true;
						if (valid4) {
							if (data.participant !== void 0) {
								const _errs24 = errors;
								if (!validate66(data.participant, {
									instancePath: instancePath + "/participant",
									parentData: data,
									parentDataProperty: "participant",
									rootData,
									dynamicAnchors
								})) {
									vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
									errors = vErrors.length;
								}
								var valid4 = _errs24 === errors;
							} else var valid4 = true;
						}
					}
				}
			} else {
				const err19 = {
					instancePath,
					schemaPath: "#/oneOf/2/type",
					keyword: "type",
					params: { type: "object" },
					message: "must be object"
				};
				if (vErrors === null) vErrors = [err19];
				else vErrors.push(err19);
				errors++;
			}
		}
		var _valid0 = _errs19 === errors;
		if (_valid0 && valid0) {
			valid0 = false;
			passing0 = [passing0, 2];
		} else {
			if (_valid0) {
				valid0 = true;
				passing0 = 2;
				if (props0 !== true) props0 = true;
			}
			const _errs25 = errors;
			if (errors === _errs25) {
				if (data && typeof data == "object" && !Array.isArray(data)) {
					let missing3;
					if (data.kind === void 0 && (missing3 = "kind") || data.agent_id === void 0 && (missing3 = "agent_id") || data.revision === void 0 && (missing3 = "revision")) {
						const err20 = {
							instancePath,
							schemaPath: "#/oneOf/3/required",
							keyword: "required",
							params: { missingProperty: missing3 },
							message: "must have required property '" + missing3 + "'"
						};
						if (vErrors === null) vErrors = [err20];
						else vErrors.push(err20);
						errors++;
					} else {
						const _errs27 = errors;
						for (const key3 in data) if (!(key3 === "kind" || key3 === "agent_id" || key3 === "revision")) {
							const err21 = {
								instancePath,
								schemaPath: "#/oneOf/3/additionalProperties",
								keyword: "additionalProperties",
								params: { additionalProperty: key3 },
								message: "must NOT have additional properties"
							};
							if (vErrors === null) vErrors = [err21];
							else vErrors.push(err21);
							errors++;
							break;
						}
						if (_errs27 === errors) {
							if (data.kind !== void 0) {
								let data8 = data.kind;
								const _errs28 = errors;
								if (typeof data8 !== "string") {
									const err22 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/3/properties/kind/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err22];
									else vErrors.push(err22);
									errors++;
								}
								if ("agent_configuration_changed" !== data8) {
									const err23 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/3/properties/kind/const",
										keyword: "const",
										params: { allowedValue: "agent_configuration_changed" },
										message: "must be equal to constant"
									};
									if (vErrors === null) vErrors = [err23];
									else vErrors.push(err23);
									errors++;
								}
								var valid5 = _errs28 === errors;
							} else var valid5 = true;
							if (valid5) {
								if (data.agent_id !== void 0) {
									const _errs30 = errors;
									if (typeof data.agent_id !== "string") {
										const err24 = {
											instancePath: instancePath + "/agent_id",
											schemaPath: "#/oneOf/3/properties/agent_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err24];
										else vErrors.push(err24);
										errors++;
									}
									var valid5 = _errs30 === errors;
								} else var valid5 = true;
								if (valid5) {
									if (data.revision !== void 0) {
										let data10 = data.revision;
										const _errs32 = errors;
										if (errors === errors) {
											if (typeof data10 === "string") {
												if (func2(data10) > 19) {
													const err25 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/maxLength",
														keyword: "maxLength",
														params: { limit: 19 },
														message: "must NOT have more than 19 characters"
													};
													if (vErrors === null) vErrors = [err25];
													else vErrors.push(err25);
													errors++;
												} else if (!pattern4.test(data10)) {
													const err26 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/pattern",
														keyword: "pattern",
														params: { pattern: "^(0|[1-9][0-9]*)$" },
														message: "must match pattern \"^(0|[1-9][0-9]*)$\""
													};
													if (vErrors === null) vErrors = [err26];
													else vErrors.push(err26);
													errors++;
												}
											} else {
												const err27 = {
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												};
												if (vErrors === null) vErrors = [err27];
												else vErrors.push(err27);
												errors++;
											}
										}
										var valid5 = _errs32 === errors;
									} else var valid5 = true;
								}
							}
						}
					}
				} else {
					const err28 = {
						instancePath,
						schemaPath: "#/oneOf/3/type",
						keyword: "type",
						params: { type: "object" },
						message: "must be object"
					};
					if (vErrors === null) vErrors = [err28];
					else vErrors.push(err28);
					errors++;
				}
			}
			var _valid0 = _errs25 === errors;
			if (_valid0 && valid0) {
				valid0 = false;
				passing0 = [passing0, 3];
			} else {
				if (_valid0) {
					valid0 = true;
					passing0 = 3;
					if (props0 !== true) props0 = true;
				}
				const _errs35 = errors;
				if (errors === _errs35) {
					if (data && typeof data == "object" && !Array.isArray(data)) {
						let missing4;
						if (data.kind === void 0 && (missing4 = "kind") || data.revision === void 0 && (missing4 = "revision")) {
							const err29 = {
								instancePath,
								schemaPath: "#/oneOf/4/required",
								keyword: "required",
								params: { missingProperty: missing4 },
								message: "must have required property '" + missing4 + "'"
							};
							if (vErrors === null) vErrors = [err29];
							else vErrors.push(err29);
							errors++;
						} else {
							const _errs37 = errors;
							for (const key4 in data) if (!(key4 === "kind" || key4 === "revision")) {
								const err30 = {
									instancePath,
									schemaPath: "#/oneOf/4/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key4 },
									message: "must NOT have additional properties"
								};
								if (vErrors === null) vErrors = [err30];
								else vErrors.push(err30);
								errors++;
								break;
							}
							if (_errs37 === errors) {
								if (data.kind !== void 0) {
									let data11 = data.kind;
									const _errs38 = errors;
									if (typeof data11 !== "string") {
										const err31 = {
											instancePath: instancePath + "/kind",
											schemaPath: "#/oneOf/4/properties/kind/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err31];
										else vErrors.push(err31);
										errors++;
									}
									if ("global_configuration_changed" !== data11) {
										const err32 = {
											instancePath: instancePath + "/kind",
											schemaPath: "#/oneOf/4/properties/kind/const",
											keyword: "const",
											params: { allowedValue: "global_configuration_changed" },
											message: "must be equal to constant"
										};
										if (vErrors === null) vErrors = [err32];
										else vErrors.push(err32);
										errors++;
									}
									var valid7 = _errs38 === errors;
								} else var valid7 = true;
								if (valid7) {
									if (data.revision !== void 0) {
										let data12 = data.revision;
										const _errs40 = errors;
										if (errors === errors) {
											if (typeof data12 === "string") {
												if (func2(data12) > 19) {
													const err33 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/maxLength",
														keyword: "maxLength",
														params: { limit: 19 },
														message: "must NOT have more than 19 characters"
													};
													if (vErrors === null) vErrors = [err33];
													else vErrors.push(err33);
													errors++;
												} else if (!pattern4.test(data12)) {
													const err34 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/pattern",
														keyword: "pattern",
														params: { pattern: "^(0|[1-9][0-9]*)$" },
														message: "must match pattern \"^(0|[1-9][0-9]*)$\""
													};
													if (vErrors === null) vErrors = [err34];
													else vErrors.push(err34);
													errors++;
												}
											} else {
												const err35 = {
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												};
												if (vErrors === null) vErrors = [err35];
												else vErrors.push(err35);
												errors++;
											}
										}
										var valid7 = _errs40 === errors;
									} else var valid7 = true;
								}
							}
						}
					} else {
						const err36 = {
							instancePath,
							schemaPath: "#/oneOf/4/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						};
						if (vErrors === null) vErrors = [err36];
						else vErrors.push(err36);
						errors++;
					}
				}
				var _valid0 = _errs35 === errors;
				if (_valid0 && valid0) {
					valid0 = false;
					passing0 = [passing0, 4];
				} else if (_valid0) {
					valid0 = true;
					passing0 = 4;
					if (props0 !== true) props0 = true;
				}
			}
		}
	}
	if (!valid0) {
		const err37 = {
			instancePath,
			schemaPath: "#/oneOf",
			keyword: "oneOf",
			params: { passingSchemas: passing0 },
			message: "must match exactly one schema in oneOf"
		};
		if (vErrors === null) vErrors = [err37];
		else vErrors.push(err37);
		errors++;
		validate72.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate72.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate72.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
function validate71(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate71.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.event_seq === void 0 && (missing0 = "event_seq") || data.event_id === void 0 && (missing0 = "event_id") || data.occurred_at === void 0 && (missing0 = "occurred_at") || data.payload === void 0 && (missing0 = "payload")) {
				validate71.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data_generation_id" || key0 === "event_seq" || key0 === "event_id" || key0 === "occurred_at" || key0 === "payload")) {
					validate71.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate71.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate71.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema87.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data_generation_id !== void 0) {
							const _errs5 = errors;
							if (typeof data.data_generation_id !== "string") {
								validate71.errors = [{
									instancePath: instancePath + "/data_generation_id",
									schemaPath: "#/properties/data_generation_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.event_seq !== void 0) {
								let data2 = data.event_seq;
								const _errs7 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											validate71.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate71.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate71.errors = [{
											instancePath: instancePath + "/event_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.event_id !== void 0) {
									const _errs10 = errors;
									if (typeof data.event_id !== "string") {
										validate71.errors = [{
											instancePath: instancePath + "/event_id",
											schemaPath: "#/properties/event_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs10 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.occurred_at !== void 0) {
										let data4 = data.occurred_at;
										const _errs12 = errors;
										if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
											validate71.errors = [{
												instancePath: instancePath + "/occurred_at",
												schemaPath: "#/properties/occurred_at/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (errors === _errs12) {
											if (typeof data4 == "number" && isFinite(data4)) {
												if (data4 > 9007199254740991 || isNaN(data4)) {
													validate71.errors = [{
														instancePath: instancePath + "/occurred_at",
														schemaPath: "#/properties/occurred_at/maximum",
														keyword: "maximum",
														params: {
															comparison: "<=",
															limit: 9007199254740991
														},
														message: "must be <= 9007199254740991"
													}];
													return false;
												} else if (data4 < -9007199254740991 || isNaN(data4)) {
													validate71.errors = [{
														instancePath: instancePath + "/occurred_at",
														schemaPath: "#/properties/occurred_at/minimum",
														keyword: "minimum",
														params: {
															comparison: ">=",
															limit: -9007199254740991
														},
														message: "must be >= -9007199254740991"
													}];
													return false;
												}
											}
										}
										var valid0 = _errs12 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.payload !== void 0) {
											const _errs14 = errors;
											if (!validate72(data.payload, {
												instancePath: instancePath + "/payload",
												parentData: data,
												parentDataProperty: "payload",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate72.errors : vErrors.concat(validate72.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs14 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate71.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate71.errors = vErrors;
	return errors === 0;
}
validate71.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate77.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.database_bytes === void 0 && (missing0 = "database_bytes") || data.avatar_bytes === void 0 && (missing0 = "avatar_bytes")) {
			validate77.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "database_bytes" || key0 === "avatar_bytes")) {
				validate77.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.database_bytes !== void 0) {
				let data0 = data.database_bytes;
				if (typeof data0 === "string") {
					if (func2(data0) > 19) {
						validate77.errors = [{
							instancePath: instancePath + "/database_bytes",
							schemaPath: "#/$defs/DecimalString/maxLength",
							keyword: "maxLength",
							params: { limit: 19 },
							message: "must NOT have more than 19 characters"
						}];
						return false;
					} else if (!pattern4.test(data0)) {
						validate77.errors = [{
							instancePath: instancePath + "/database_bytes",
							schemaPath: "#/$defs/DecimalString/pattern",
							keyword: "pattern",
							params: { pattern: "^(0|[1-9][0-9]*)$" },
							message: "must match pattern \"^(0|[1-9][0-9]*)$\""
						}];
						return false;
					}
				} else {
					validate77.errors = [{
						instancePath: instancePath + "/database_bytes",
						schemaPath: "#/$defs/DecimalString/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.avatar_bytes !== void 0) {
					let data1 = data.avatar_bytes;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate77.errors = [{
								instancePath: instancePath + "/avatar_bytes",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate77.errors = [{
								instancePath: instancePath + "/avatar_bytes",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate77.errors = [{
							instancePath: instancePath + "/avatar_bytes",
							schemaPath: "#/$defs/DecimalString/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate77.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate77.errors = vErrors;
	return true;
}
validate77.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate63(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate63.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.room === void 0 && (missing0 = "room") || data.local_user === void 0 && (missing0 = "local_user") || data.participants === void 0 && (missing0 = "participants") || data.appearance === void 0 && (missing0 = "appearance") || data.latest_message_seq === void 0 && (missing0 = "latest_message_seq") || data.latest_event_seq === void 0 && (missing0 = "latest_event_seq") || data.events === void 0 && (missing0 = "events") || data.requires_full_reload === void 0 && (missing0 = "requires_full_reload") || data.data_directory === void 0 && (missing0 = "data_directory") || data.data_usage === void 0 && (missing0 = "data_usage") || data.app_version === void 0 && (missing0 = "app_version") || data.development_tools_available === void 0 && (missing0 = "development_tools_available")) {
				validate63.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema88.properties, key0)) {
					validate63.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate63.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.room !== void 0) {
							const _errs4 = errors;
							if (!validate64(data.room, {
								instancePath: instancePath + "/room",
								parentData: data,
								parentDataProperty: "room",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate64.errors : vErrors.concat(validate64.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.local_user !== void 0) {
								const _errs5 = errors;
								if (!validate66(data.local_user, {
									instancePath: instancePath + "/local_user",
									parentData: data,
									parentDataProperty: "local_user",
									rootData,
									dynamicAnchors
								})) {
									vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
									errors = vErrors.length;
								}
								var valid0 = _errs5 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.participants !== void 0) {
									let data3 = data.participants;
									const _errs6 = errors;
									if (errors === _errs6) {
										if (Array.isArray(data3)) {
											const len0 = data3.length;
											for (let i0 = 0; i0 < len0; i0++) {
												const _errs8 = errors;
												if (!validate66(data3[i0], {
													instancePath: instancePath + "/participants/" + i0,
													parentData: data3,
													parentDataProperty: i0,
													rootData,
													dynamicAnchors
												})) {
													vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
													errors = vErrors.length;
												}
												if (!(_errs8 === errors)) break;
											}
										} else {
											validate63.errors = [{
												instancePath: instancePath + "/participants",
												schemaPath: "#/properties/participants/type",
												keyword: "type",
												params: { type: "array" },
												message: "must be array"
											}];
											return false;
										}
									}
									var valid0 = _errs6 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.appearance !== void 0) {
										const _errs9 = errors;
										if (!validate69(data.appearance, {
											instancePath: instancePath + "/appearance",
											parentData: data,
											parentDataProperty: "appearance",
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
											errors = vErrors.length;
										}
										var valid0 = _errs9 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.latest_message_seq !== void 0) {
											let data6 = data.latest_message_seq;
											const _errs10 = errors;
											if (errors === errors) {
												if (typeof data6 === "string") {
													if (func2(data6) > 19) {
														validate63.errors = [{
															instancePath: instancePath + "/latest_message_seq",
															schemaPath: "#/$defs/DecimalString/maxLength",
															keyword: "maxLength",
															params: { limit: 19 },
															message: "must NOT have more than 19 characters"
														}];
														return false;
													} else if (!pattern4.test(data6)) {
														validate63.errors = [{
															instancePath: instancePath + "/latest_message_seq",
															schemaPath: "#/$defs/DecimalString/pattern",
															keyword: "pattern",
															params: { pattern: "^(0|[1-9][0-9]*)$" },
															message: "must match pattern \"^(0|[1-9][0-9]*)$\""
														}];
														return false;
													}
												} else {
													validate63.errors = [{
														instancePath: instancePath + "/latest_message_seq",
														schemaPath: "#/$defs/DecimalString/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
											}
											var valid0 = _errs10 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.latest_event_seq !== void 0) {
												let data7 = data.latest_event_seq;
												const _errs13 = errors;
												if (errors === errors) {
													if (typeof data7 === "string") {
														if (func2(data7) > 19) {
															validate63.errors = [{
																instancePath: instancePath + "/latest_event_seq",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data7)) {
															validate63.errors = [{
																instancePath: instancePath + "/latest_event_seq",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate63.errors = [{
															instancePath: instancePath + "/latest_event_seq",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs13 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.events !== void 0) {
													let data8 = data.events;
													const _errs16 = errors;
													if (errors === _errs16) {
														if (Array.isArray(data8)) {
															const len1 = data8.length;
															for (let i1 = 0; i1 < len1; i1++) {
																const _errs18 = errors;
																if (!validate71(data8[i1], {
																	instancePath: instancePath + "/events/" + i1,
																	parentData: data8,
																	parentDataProperty: i1,
																	rootData,
																	dynamicAnchors
																})) {
																	vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
																	errors = vErrors.length;
																}
																if (!(_errs18 === errors)) break;
															}
														} else {
															validate63.errors = [{
																instancePath: instancePath + "/events",
																schemaPath: "#/properties/events/type",
																keyword: "type",
																params: { type: "array" },
																message: "must be array"
															}];
															return false;
														}
													}
													var valid0 = _errs16 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.requires_full_reload !== void 0) {
														const _errs19 = errors;
														if (typeof data.requires_full_reload !== "boolean") {
															validate63.errors = [{
																instancePath: instancePath + "/requires_full_reload",
																schemaPath: "#/properties/requires_full_reload/type",
																keyword: "type",
																params: { type: "boolean" },
																message: "must be boolean"
															}];
															return false;
														}
														var valid0 = _errs19 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.data_directory !== void 0) {
															const _errs21 = errors;
															if (typeof data.data_directory !== "string") {
																validate63.errors = [{
																	instancePath: instancePath + "/data_directory",
																	schemaPath: "#/properties/data_directory/type",
																	keyword: "type",
																	params: { type: "string" },
																	message: "must be string"
																}];
																return false;
															}
															var valid0 = _errs21 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.data_usage !== void 0) {
																const _errs23 = errors;
																if (!validate77(data.data_usage, {
																	instancePath: instancePath + "/data_usage",
																	parentData: data,
																	parentDataProperty: "data_usage",
																	rootData,
																	dynamicAnchors
																})) {
																	vErrors = vErrors === null ? validate77.errors : vErrors.concat(validate77.errors);
																	errors = vErrors.length;
																}
																var valid0 = _errs23 === errors;
															} else var valid0 = true;
															if (valid0) {
																if (data.app_version !== void 0) {
																	const _errs24 = errors;
																	if (typeof data.app_version !== "string") {
																		validate63.errors = [{
																			instancePath: instancePath + "/app_version",
																			schemaPath: "#/properties/app_version/type",
																			keyword: "type",
																			params: { type: "string" },
																			message: "must be string"
																		}];
																		return false;
																	}
																	var valid0 = _errs24 === errors;
																} else var valid0 = true;
																if (valid0) {
																	if (data.development_tools_available !== void 0) {
																		const _errs26 = errors;
																		if (typeof data.development_tools_available !== "boolean") {
																			validate63.errors = [{
																				instancePath: instancePath + "/development_tools_available",
																				schemaPath: "#/properties/development_tools_available/type",
																				keyword: "type",
																				params: { type: "boolean" },
																				message: "must be boolean"
																			}];
																			return false;
																		}
																		var valid0 = _errs26 === errors;
																	} else var valid0 = true;
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate63.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate63.errors = vErrors;
	return errors === 0;
}
validate63.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate62(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate62.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate62.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate62.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate62.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate62.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema87.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate63(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate63.errors : vErrors.concat(validate63.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate62.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate62.errors = vErrors;
	return errors === 0;
}
validate62.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema113 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema114 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema115 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate82(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate82.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate82.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate82.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate82.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate82.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema114.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate82.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate82.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate82.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema115.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate82.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema113.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate82.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate82.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate82.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate82.errors = vErrors;
	return true;
}
validate82.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate81(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate81.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate81.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate81.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate81.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate81.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema87.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate82(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate82.errors : vErrors.concat(validate82.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate81.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate81.errors = vErrors;
	return errors === 0;
}
validate81.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate61(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate61.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate62(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate81(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate81.errors : vErrors.concat(validate81.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate61.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate61.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate61.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateAppearanceSaveRequest = validate85;
var schema118 = {
	"type": "string",
	"enum": [
		"system",
		"light",
		"dark"
	]
};
function validate85(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate85.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion")) {
			validate85.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "client_request_id" || key0 === "expected_revision" || key0 === "theme" || key0 === "reduce_motion")) {
				validate85.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate85.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.client_request_id !== void 0) {
					if (typeof data.client_request_id !== "string") {
						validate85.errors = [{
							instancePath: instancePath + "/client_request_id",
							schemaPath: "#/properties/client_request_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.expected_revision !== void 0) {
						let data2 = data.expected_revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate85.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate85.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate85.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.theme !== void 0) {
							let data3 = data.theme;
							if (typeof data3 !== "string") {
								validate85.errors = [{
									instancePath: instancePath + "/theme",
									schemaPath: "#/$defs/Theme/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data3 === "system" || data3 === "light" || data3 === "dark")) {
								validate85.errors = [{
									instancePath: instancePath + "/theme",
									schemaPath: "#/$defs/Theme/enum",
									keyword: "enum",
									params: { allowedValues: schema118.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.reduce_motion !== void 0) {
								if (typeof data.reduce_motion !== "boolean") {
									validate85.errors = [{
										instancePath: instancePath + "/reduce_motion",
										schemaPath: "#/properties/reduce_motion/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate85.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate85.errors = vErrors;
	return true;
}
validate85.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateAppearanceSaveResponse = validate86;
var schema121 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema123 = {
	"type": "string",
	"enum": [
		"system",
		"light",
		"dark"
	]
};
function validate88(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate88.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion") || data.revision === void 0 && (missing0 = "revision")) {
			validate88.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "theme" || key0 === "reduce_motion" || key0 === "revision")) {
				validate88.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.theme !== void 0) {
				let data0 = data.theme;
				if (typeof data0 !== "string") {
					validate88.errors = [{
						instancePath: instancePath + "/theme",
						schemaPath: "#/$defs/Theme/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "system" || data0 === "light" || data0 === "dark")) {
					validate88.errors = [{
						instancePath: instancePath + "/theme",
						schemaPath: "#/$defs/Theme/enum",
						keyword: "enum",
						params: { allowedValues: schema123.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.reduce_motion !== void 0) {
					if (typeof data.reduce_motion !== "boolean") {
						validate88.errors = [{
							instancePath: instancePath + "/reduce_motion",
							schemaPath: "#/properties/reduce_motion/type",
							keyword: "type",
							params: { type: "boolean" },
							message: "must be boolean"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.revision !== void 0) {
						let data2 = data.revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate88.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate88.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate88.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate88.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate88.errors = vErrors;
	return true;
}
validate88.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate87(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate87.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate87.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate87.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate87.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate87.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema121.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate88(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate88.errors : vErrors.concat(validate88.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate87.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate87.errors = vErrors;
	return errors === 0;
}
validate87.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema127 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema128 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema129 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate92(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate92.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate92.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate92.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate92.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate92.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema128.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate92.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate92.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate92.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema129.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate92.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema127.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate92.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate92.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate92.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate92.errors = vErrors;
	return true;
}
validate92.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate91(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate91.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate91.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate91.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate91.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate91.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema121.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate92(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate91.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate91.errors = vErrors;
	return errors === 0;
}
validate91.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate86(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate86.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate87(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate87.errors : vErrors.concat(validate87.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate91(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate91.errors : vErrors.concat(validate91.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate86.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate86.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate86.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateAvatarImportRequest = validate95;
function validate95(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate95.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id")) {
			validate95.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id")) {
				validate95.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate95.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
			}
		}
	} else {
		validate95.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate95.errors = vErrors;
	return true;
}
validate95.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateAvatarImportResponse = validate96;
var schema133 = {
	"type": "string",
	"enum": ["0.3"]
};
function validate97(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate97.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate97.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate97.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate97.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate97.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema133.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							let data1 = data.data;
							const _errs5 = errors;
							const _errs6 = errors;
							let valid2 = false;
							const _errs7 = errors;
							if (errors === errors) {
								if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
									let missing1;
									if (data1.id === void 0 && (missing1 = "id") || data1.mime_type === void 0 && (missing1 = "mime_type") || data1.width === void 0 && (missing1 = "width") || data1.height === void 0 && (missing1 = "height") || data1.byte_size === void 0 && (missing1 = "byte_size")) {
										const err0 = {
											instancePath: instancePath + "/data",
											schemaPath: "#/$defs/AvatarObject/required",
											keyword: "required",
											params: { missingProperty: missing1 },
											message: "must have required property '" + missing1 + "'"
										};
										if (vErrors === null) vErrors = [err0];
										else vErrors.push(err0);
										errors++;
									} else {
										const _errs10 = errors;
										for (const key1 in data1) if (!(key1 === "id" || key1 === "mime_type" || key1 === "width" || key1 === "height" || key1 === "byte_size")) {
											const err1 = {
												instancePath: instancePath + "/data",
												schemaPath: "#/$defs/AvatarObject/additionalProperties",
												keyword: "additionalProperties",
												params: { additionalProperty: key1 },
												message: "must NOT have additional properties"
											};
											if (vErrors === null) vErrors = [err1];
											else vErrors.push(err1);
											errors++;
											break;
										}
										if (_errs10 === errors) {
											if (data1.id !== void 0) {
												const _errs11 = errors;
												if (typeof data1.id !== "string") {
													const err2 = {
														instancePath: instancePath + "/data/id",
														schemaPath: "#/$defs/AvatarObject/properties/id/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													};
													if (vErrors === null) vErrors = [err2];
													else vErrors.push(err2);
													errors++;
												}
												var valid4 = _errs11 === errors;
											} else var valid4 = true;
											if (valid4) {
												if (data1.mime_type !== void 0) {
													const _errs13 = errors;
													if (typeof data1.mime_type !== "string") {
														const err3 = {
															instancePath: instancePath + "/data/mime_type",
															schemaPath: "#/$defs/AvatarObject/properties/mime_type/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														};
														if (vErrors === null) vErrors = [err3];
														else vErrors.push(err3);
														errors++;
													}
													var valid4 = _errs13 === errors;
												} else var valid4 = true;
												if (valid4) {
													if (data1.width !== void 0) {
														let data4 = data1.width;
														const _errs15 = errors;
														if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
															const err4 = {
																instancePath: instancePath + "/data/width",
																schemaPath: "#/$defs/AvatarObject/properties/width/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															};
															if (vErrors === null) vErrors = [err4];
															else vErrors.push(err4);
															errors++;
														}
														if (errors === _errs15) {
															if (typeof data4 == "number" && isFinite(data4)) {
																if (data4 < 0 || isNaN(data4)) {
																	const err5 = {
																		instancePath: instancePath + "/data/width",
																		schemaPath: "#/$defs/AvatarObject/properties/width/minimum",
																		keyword: "minimum",
																		params: {
																			comparison: ">=",
																			limit: 0
																		},
																		message: "must be >= 0"
																	};
																	if (vErrors === null) vErrors = [err5];
																	else vErrors.push(err5);
																	errors++;
																}
															}
														}
														var valid4 = _errs15 === errors;
													} else var valid4 = true;
													if (valid4) {
														if (data1.height !== void 0) {
															let data5 = data1.height;
															const _errs17 = errors;
															if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5))) {
																const err6 = {
																	instancePath: instancePath + "/data/height",
																	schemaPath: "#/$defs/AvatarObject/properties/height/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																};
																if (vErrors === null) vErrors = [err6];
																else vErrors.push(err6);
																errors++;
															}
															if (errors === _errs17) {
																if (typeof data5 == "number" && isFinite(data5)) {
																	if (data5 < 0 || isNaN(data5)) {
																		const err7 = {
																			instancePath: instancePath + "/data/height",
																			schemaPath: "#/$defs/AvatarObject/properties/height/minimum",
																			keyword: "minimum",
																			params: {
																				comparison: ">=",
																				limit: 0
																			},
																			message: "must be >= 0"
																		};
																		if (vErrors === null) vErrors = [err7];
																		else vErrors.push(err7);
																		errors++;
																	}
																}
															}
															var valid4 = _errs17 === errors;
														} else var valid4 = true;
														if (valid4) {
															if (data1.byte_size !== void 0) {
																let data6 = data1.byte_size;
																const _errs19 = errors;
																if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
																	const err8 = {
																		instancePath: instancePath + "/data/byte_size",
																		schemaPath: "#/$defs/AvatarObject/properties/byte_size/type",
																		keyword: "type",
																		params: { type: "integer" },
																		message: "must be integer"
																	};
																	if (vErrors === null) vErrors = [err8];
																	else vErrors.push(err8);
																	errors++;
																}
																if (errors === _errs19) {
																	if (typeof data6 == "number" && isFinite(data6)) {
																		if (data6 < 0 || isNaN(data6)) {
																			const err9 = {
																				instancePath: instancePath + "/data/byte_size",
																				schemaPath: "#/$defs/AvatarObject/properties/byte_size/minimum",
																				keyword: "minimum",
																				params: {
																					comparison: ">=",
																					limit: 0
																				},
																				message: "must be >= 0"
																			};
																			if (vErrors === null) vErrors = [err9];
																			else vErrors.push(err9);
																			errors++;
																		}
																	}
																}
																var valid4 = _errs19 === errors;
															} else var valid4 = true;
														}
													}
												}
											}
										}
									}
								} else {
									const err10 = {
										instancePath: instancePath + "/data",
										schemaPath: "#/$defs/AvatarObject/type",
										keyword: "type",
										params: { type: "object" },
										message: "must be object"
									};
									if (vErrors === null) vErrors = [err10];
									else vErrors.push(err10);
									errors++;
								}
							}
							var _valid0 = _errs7 === errors;
							valid2 = valid2 || _valid0;
							const _errs21 = errors;
							if (data1 !== null) {
								const err11 = {
									instancePath: instancePath + "/data",
									schemaPath: "#/properties/data/anyOf/1/type",
									keyword: "type",
									params: { type: "null" },
									message: "must be null"
								};
								if (vErrors === null) vErrors = [err11];
								else vErrors.push(err11);
								errors++;
							}
							var _valid0 = _errs21 === errors;
							valid2 = valid2 || _valid0;
							if (!valid2) {
								const err12 = {
									instancePath: instancePath + "/data",
									schemaPath: "#/properties/data/anyOf",
									keyword: "anyOf",
									params: {},
									message: "must match a schema in anyOf"
								};
								if (vErrors === null) vErrors = [err12];
								else vErrors.push(err12);
								errors++;
								validate97.errors = vErrors;
								return false;
							} else {
								errors = _errs6;
								if (vErrors !== null) {
									if (_errs6) vErrors.length = _errs6;
									else vErrors = null;
								}
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate97.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate97.errors = vErrors;
	return errors === 0;
}
validate97.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema137 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema138 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema139 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate100(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate100.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate100.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate100.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate100.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate100.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema138.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate100.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate100.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate100.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema139.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate100.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema137.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate100.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate100.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate100.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate100.errors = vErrors;
	return true;
}
validate100.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate99(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate99.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate99.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate99.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate99.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate99.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema133.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate100(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate100.errors : vErrors.concat(validate100.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate99.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate99.errors = vErrors;
	return errors === 0;
}
validate99.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate96(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate96.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate97(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate99(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate96.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate96.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate96.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateAvatarReadRequest = validate103;
function validate103(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate103.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.avatar_id === void 0 && (missing0 = "avatar_id")) {
			validate103.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "avatar_id")) {
				validate103.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate103.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.avatar_id !== void 0) {
					if (typeof data.avatar_id !== "string") {
						validate103.errors = [{
							instancePath: instancePath + "/avatar_id",
							schemaPath: "#/properties/avatar_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate103.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate103.errors = vErrors;
	return true;
}
validate103.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateAvatarReadResponse = validate104;
var schema143 = {
	"type": "string",
	"enum": ["0.3"]
};
function validate105(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate105.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate105.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
				validate105.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.schema_version !== void 0) {
				let data0 = data.schema_version;
				if (typeof data0 !== "string") {
					validate105.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "0.3")) {
					validate105.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/enum",
						keyword: "enum",
						params: { allowedValues: schema143.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data !== void 0) {
					let data1 = data.data;
					if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
						let missing1;
						if (data1.avatar_id === void 0 && (missing1 = "avatar_id") || data1.mime_type === void 0 && (missing1 = "mime_type") || data1.data_base64 === void 0 && (missing1 = "data_base64")) {
							validate105.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/AvatarData/required",
								keyword: "required",
								params: { missingProperty: missing1 },
								message: "must have required property '" + missing1 + "'"
							}];
							return false;
						} else {
							for (const key1 in data1) if (!(key1 === "avatar_id" || key1 === "mime_type" || key1 === "data_base64")) {
								validate105.errors = [{
									instancePath: instancePath + "/data",
									schemaPath: "#/$defs/AvatarData/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key1 },
									message: "must NOT have additional properties"
								}];
								return false;
							}
							if (data1.avatar_id !== void 0) {
								if (typeof data1.avatar_id !== "string") {
									validate105.errors = [{
										instancePath: instancePath + "/data/avatar_id",
										schemaPath: "#/$defs/AvatarData/properties/avatar_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid3 = true;
							} else var valid3 = true;
							if (valid3) {
								if (data1.mime_type !== void 0) {
									if (typeof data1.mime_type !== "string") {
										validate105.errors = [{
											instancePath: instancePath + "/data/mime_type",
											schemaPath: "#/$defs/AvatarData/properties/mime_type/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid3 = true;
								} else var valid3 = true;
								if (valid3) {
									if (data1.data_base64 !== void 0) {
										if (typeof data1.data_base64 !== "string") {
											validate105.errors = [{
												instancePath: instancePath + "/data/data_base64",
												schemaPath: "#/$defs/AvatarData/properties/data_base64/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid3 = true;
									} else var valid3 = true;
								}
							}
						}
					} else {
						validate105.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/AvatarData/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate105.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate105.errors = vErrors;
	return true;
}
validate105.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema147 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema148 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema149 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate108(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate108.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate108.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate108.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate108.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate108.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema148.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate108.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate108.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate108.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema149.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate108.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema147.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate108.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate108.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate108.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate108.errors = vErrors;
	return true;
}
validate108.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate107(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate107.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate107.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate107.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate107.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate107.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema143.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate108(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate108.errors : vErrors.concat(validate108.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate107.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate107.errors = vErrors;
	return errors === 0;
}
validate107.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate104(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate104.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate105(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate105.errors : vErrors.concat(validate105.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate107(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate107.errors : vErrors.concat(validate107.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate104.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate104.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate104.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateCancelSearchRequest = validate111;
function validate111(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate111.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id")) {
			validate111.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "search_id")) {
				validate111.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate111.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.search_id !== void 0) {
					if (typeof data.search_id !== "string") {
						validate111.errors = [{
							instancePath: instancePath + "/search_id",
							schemaPath: "#/properties/search_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate111.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate111.errors = vErrors;
	return true;
}
validate111.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateCancelSearchResponse = validate112;
var schema153 = {
	"type": "string",
	"enum": ["0.3"]
};
function validate113(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate113.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate113.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
				validate113.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.schema_version !== void 0) {
				let data0 = data.schema_version;
				if (typeof data0 !== "string") {
					validate113.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "0.3")) {
					validate113.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/enum",
						keyword: "enum",
						params: { allowedValues: schema153.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data !== void 0) {
					let data1 = data.data;
					if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
						let missing1;
						if (data1.search_id === void 0 && (missing1 = "search_id") || data1.cancellation_requested === void 0 && (missing1 = "cancellation_requested")) {
							validate113.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/CancelSearchResult/required",
								keyword: "required",
								params: { missingProperty: missing1 },
								message: "must have required property '" + missing1 + "'"
							}];
							return false;
						} else {
							for (const key1 in data1) if (!(key1 === "search_id" || key1 === "cancellation_requested")) {
								validate113.errors = [{
									instancePath: instancePath + "/data",
									schemaPath: "#/$defs/CancelSearchResult/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key1 },
									message: "must NOT have additional properties"
								}];
								return false;
							}
							if (data1.search_id !== void 0) {
								if (typeof data1.search_id !== "string") {
									validate113.errors = [{
										instancePath: instancePath + "/data/search_id",
										schemaPath: "#/$defs/CancelSearchResult/properties/search_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid3 = true;
							} else var valid3 = true;
							if (valid3) {
								if (data1.cancellation_requested !== void 0) {
									if (typeof data1.cancellation_requested !== "boolean") {
										validate113.errors = [{
											instancePath: instancePath + "/data/cancellation_requested",
											schemaPath: "#/$defs/CancelSearchResult/properties/cancellation_requested/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid3 = true;
								} else var valid3 = true;
							}
						}
					} else {
						validate113.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/CancelSearchResult/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate113.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate113.errors = vErrors;
	return true;
}
validate113.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema157 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema158 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema159 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate116(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate116.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate116.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate116.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate116.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate116.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema158.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate116.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate116.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate116.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema159.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate116.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema157.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate116.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate116.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate116.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate116.errors = vErrors;
	return true;
}
validate116.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate115(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate115.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate115.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate115.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate115.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate115.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema153.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate116(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate116.errors : vErrors.concat(validate116.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate115.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate115.errors = vErrors;
	return errors === 0;
}
validate115.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate112(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate112.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate113(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate113.errors : vErrors.concat(validate113.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate115(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate112.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate112.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate112.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateChatListRequest = validate119;
function validate119(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate119.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.limit === void 0 && (missing0 = "limit")) {
				validate119.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "before_seq" || key0 === "after_seq" || key0 === "around_seq" || key0 === "limit")) {
					validate119.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate119.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.before_seq !== void 0) {
							let data1 = data.before_seq;
							const _errs4 = errors;
							const _errs5 = errors;
							let valid1 = false;
							const _errs6 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										const err0 = {
											instancePath: instancePath + "/before_seq",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										};
										if (vErrors === null) vErrors = [err0];
										else vErrors.push(err0);
										errors++;
									} else if (!pattern4.test(data1)) {
										const err1 = {
											instancePath: instancePath + "/before_seq",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										};
										if (vErrors === null) vErrors = [err1];
										else vErrors.push(err1);
										errors++;
									}
								} else {
									const err2 = {
										instancePath: instancePath + "/before_seq",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err2];
									else vErrors.push(err2);
									errors++;
								}
							}
							var _valid0 = _errs6 === errors;
							valid1 = valid1 || _valid0;
							const _errs9 = errors;
							if (data1 !== null) {
								const err3 = {
									instancePath: instancePath + "/before_seq",
									schemaPath: "#/properties/before_seq/anyOf/1/type",
									keyword: "type",
									params: { type: "null" },
									message: "must be null"
								};
								if (vErrors === null) vErrors = [err3];
								else vErrors.push(err3);
								errors++;
							}
							var _valid0 = _errs9 === errors;
							valid1 = valid1 || _valid0;
							if (!valid1) {
								const err4 = {
									instancePath: instancePath + "/before_seq",
									schemaPath: "#/properties/before_seq/anyOf",
									keyword: "anyOf",
									params: {},
									message: "must match a schema in anyOf"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
								validate119.errors = vErrors;
								return false;
							} else {
								errors = _errs5;
								if (vErrors !== null) {
									if (_errs5) vErrors.length = _errs5;
									else vErrors = null;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.after_seq !== void 0) {
								let data2 = data.after_seq;
								const _errs11 = errors;
								const _errs12 = errors;
								let valid3 = false;
								const _errs13 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											const err5 = {
												instancePath: instancePath + "/after_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err5];
											else vErrors.push(err5);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err6 = {
												instancePath: instancePath + "/after_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err6];
											else vErrors.push(err6);
											errors++;
										}
									} else {
										const err7 = {
											instancePath: instancePath + "/after_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err7];
										else vErrors.push(err7);
										errors++;
									}
								}
								var _valid1 = _errs13 === errors;
								valid3 = valid3 || _valid1;
								const _errs16 = errors;
								if (data2 !== null) {
									const err8 = {
										instancePath: instancePath + "/after_seq",
										schemaPath: "#/properties/after_seq/anyOf/1/type",
										keyword: "type",
										params: { type: "null" },
										message: "must be null"
									};
									if (vErrors === null) vErrors = [err8];
									else vErrors.push(err8);
									errors++;
								}
								var _valid1 = _errs16 === errors;
								valid3 = valid3 || _valid1;
								if (!valid3) {
									const err9 = {
										instancePath: instancePath + "/after_seq",
										schemaPath: "#/properties/after_seq/anyOf",
										keyword: "anyOf",
										params: {},
										message: "must match a schema in anyOf"
									};
									if (vErrors === null) vErrors = [err9];
									else vErrors.push(err9);
									errors++;
									validate119.errors = vErrors;
									return false;
								} else {
									errors = _errs12;
									if (vErrors !== null) {
										if (_errs12) vErrors.length = _errs12;
										else vErrors = null;
									}
								}
								var valid0 = _errs11 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.around_seq !== void 0) {
									let data3 = data.around_seq;
									const _errs18 = errors;
									const _errs19 = errors;
									let valid5 = false;
									const _errs20 = errors;
									if (errors === errors) {
										if (typeof data3 === "string") {
											if (func2(data3) > 19) {
												const err10 = {
													instancePath: instancePath + "/around_seq",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												};
												if (vErrors === null) vErrors = [err10];
												else vErrors.push(err10);
												errors++;
											} else if (!pattern4.test(data3)) {
												const err11 = {
													instancePath: instancePath + "/around_seq",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												};
												if (vErrors === null) vErrors = [err11];
												else vErrors.push(err11);
												errors++;
											}
										} else {
											const err12 = {
												instancePath: instancePath + "/around_seq",
												schemaPath: "#/$defs/DecimalString/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											};
											if (vErrors === null) vErrors = [err12];
											else vErrors.push(err12);
											errors++;
										}
									}
									var _valid2 = _errs20 === errors;
									valid5 = valid5 || _valid2;
									const _errs23 = errors;
									if (data3 !== null) {
										const err13 = {
											instancePath: instancePath + "/around_seq",
											schemaPath: "#/properties/around_seq/anyOf/1/type",
											keyword: "type",
											params: { type: "null" },
											message: "must be null"
										};
										if (vErrors === null) vErrors = [err13];
										else vErrors.push(err13);
										errors++;
									}
									var _valid2 = _errs23 === errors;
									valid5 = valid5 || _valid2;
									if (!valid5) {
										const err14 = {
											instancePath: instancePath + "/around_seq",
											schemaPath: "#/properties/around_seq/anyOf",
											keyword: "anyOf",
											params: {},
											message: "must match a schema in anyOf"
										};
										if (vErrors === null) vErrors = [err14];
										else vErrors.push(err14);
										errors++;
										validate119.errors = vErrors;
										return false;
									} else {
										errors = _errs19;
										if (vErrors !== null) {
											if (_errs19) vErrors.length = _errs19;
											else vErrors = null;
										}
									}
									var valid0 = _errs18 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.limit !== void 0) {
										let data4 = data.limit;
										const _errs25 = errors;
										if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
											validate119.errors = [{
												instancePath: instancePath + "/limit",
												schemaPath: "#/properties/limit/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (errors === _errs25) {
											if (typeof data4 == "number" && isFinite(data4)) {
												if (data4 > 200 || isNaN(data4)) {
													validate119.errors = [{
														instancePath: instancePath + "/limit",
														schemaPath: "#/properties/limit/maximum",
														keyword: "maximum",
														params: {
															comparison: "<=",
															limit: 200
														},
														message: "must be <= 200"
													}];
													return false;
												} else if (data4 < 1 || isNaN(data4)) {
													validate119.errors = [{
														instancePath: instancePath + "/limit",
														schemaPath: "#/properties/limit/minimum",
														keyword: "minimum",
														params: {
															comparison: ">=",
															limit: 1
														},
														message: "must be >= 1"
													}];
													return false;
												}
											}
										}
										var valid0 = _errs25 === errors;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		} else {
			validate119.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate119.errors = vErrors;
	return errors === 0;
}
validate119.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateChatListResponse = validate120;
var schema166 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema168 = {
	"type": "object",
	"properties": {
		"id": { "type": "string" },
		"seq": { "$ref": "#/$defs/DecimalString" },
		"sender_id": { "type": "string" },
		"sender_snapshot": { "$ref": "#/$defs/SenderSnapshot" },
		"created_at": {
			"type": "integer",
			"format": "int64",
			"minimum": -9007199254740991,
			"maximum": 9007199254740991
		},
		"state": { "$ref": "#/$defs/MessageState" },
		"parts": {
			"type": "array",
			"items": { "$ref": "#/$defs/MessagePart" }
		},
		"quote_message_id": { "type": ["string", "null"] },
		"mention_ids": {
			"type": "array",
			"items": { "type": "string" }
		},
		"mention_all": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"id",
		"seq",
		"sender_id",
		"sender_snapshot",
		"created_at",
		"state",
		"parts",
		"quote_message_id",
		"mention_ids",
		"mention_all"
	]
};
var schema172 = {
	"type": "string",
	"enum": [
		"visible",
		"recalled",
		"deleted"
	]
};
var schema170 = {
	"type": "object",
	"properties": {
		"display_name": { "type": "string" },
		"kind": { "$ref": "#/$defs/ParticipantKind" },
		"avatar_id": {
			"type": ["string", "null"],
			"default": null
		}
	},
	"additionalProperties": false,
	"required": [
		"display_name",
		"kind",
		"avatar_id"
	]
};
var schema171 = {
	"type": "string",
	"enum": ["user", "agent"]
};
function validate124(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate124.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.display_name === void 0 && (missing0 = "display_name") || data.kind === void 0 && (missing0 = "kind") || data.avatar_id === void 0 && (missing0 = "avatar_id")) {
			validate124.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "display_name" || key0 === "kind" || key0 === "avatar_id")) {
				validate124.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.display_name !== void 0) {
				if (typeof data.display_name !== "string") {
					validate124.errors = [{
						instancePath: instancePath + "/display_name",
						schemaPath: "#/properties/display_name/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.kind !== void 0) {
					let data1 = data.kind;
					if (typeof data1 !== "string") {
						validate124.errors = [{
							instancePath: instancePath + "/kind",
							schemaPath: "#/$defs/ParticipantKind/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data1 === "user" || data1 === "agent")) {
						validate124.errors = [{
							instancePath: instancePath + "/kind",
							schemaPath: "#/$defs/ParticipantKind/enum",
							keyword: "enum",
							params: { allowedValues: schema171.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.avatar_id !== void 0) {
						let data2 = data.avatar_id;
						if (typeof data2 !== "string" && data2 !== null) {
							validate124.errors = [{
								instancePath: instancePath + "/avatar_id",
								schemaPath: "#/properties/avatar_id/type",
								keyword: "type",
								params: { type: schema170.properties.avatar_id.type },
								message: "must be string,null"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate124.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate124.errors = vErrors;
	return true;
}
validate124.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate123(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate123.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.seq === void 0 && (missing0 = "seq") || data.sender_id === void 0 && (missing0 = "sender_id") || data.sender_snapshot === void 0 && (missing0 = "sender_snapshot") || data.created_at === void 0 && (missing0 = "created_at") || data.state === void 0 && (missing0 = "state") || data.parts === void 0 && (missing0 = "parts") || data.quote_message_id === void 0 && (missing0 = "quote_message_id") || data.mention_ids === void 0 && (missing0 = "mention_ids") || data.mention_all === void 0 && (missing0 = "mention_all")) {
				validate123.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema168.properties, key0)) {
					validate123.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.id !== void 0) {
						const _errs2 = errors;
						if (typeof data.id !== "string") {
							validate123.errors = [{
								instancePath: instancePath + "/id",
								schemaPath: "#/properties/id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.seq !== void 0) {
							let data1 = data.seq;
							const _errs4 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										validate123.errors = [{
											instancePath: instancePath + "/seq",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data1)) {
										validate123.errors = [{
											instancePath: instancePath + "/seq",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate123.errors = [{
										instancePath: instancePath + "/seq",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.sender_id !== void 0) {
								const _errs7 = errors;
								if (typeof data.sender_id !== "string") {
									validate123.errors = [{
										instancePath: instancePath + "/sender_id",
										schemaPath: "#/properties/sender_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.sender_snapshot !== void 0) {
									const _errs9 = errors;
									if (!validate124(data.sender_snapshot, {
										instancePath: instancePath + "/sender_snapshot",
										parentData: data,
										parentDataProperty: "sender_snapshot",
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate124.errors : vErrors.concat(validate124.errors);
										errors = vErrors.length;
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.created_at !== void 0) {
										let data4 = data.created_at;
										const _errs10 = errors;
										if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
											validate123.errors = [{
												instancePath: instancePath + "/created_at",
												schemaPath: "#/properties/created_at/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (errors === _errs10) {
											if (typeof data4 == "number" && isFinite(data4)) {
												if (data4 > 9007199254740991 || isNaN(data4)) {
													validate123.errors = [{
														instancePath: instancePath + "/created_at",
														schemaPath: "#/properties/created_at/maximum",
														keyword: "maximum",
														params: {
															comparison: "<=",
															limit: 9007199254740991
														},
														message: "must be <= 9007199254740991"
													}];
													return false;
												} else if (data4 < -9007199254740991 || isNaN(data4)) {
													validate123.errors = [{
														instancePath: instancePath + "/created_at",
														schemaPath: "#/properties/created_at/minimum",
														keyword: "minimum",
														params: {
															comparison: ">=",
															limit: -9007199254740991
														},
														message: "must be >= -9007199254740991"
													}];
													return false;
												}
											}
										}
										var valid0 = _errs10 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.state !== void 0) {
											let data5 = data.state;
											const _errs12 = errors;
											if (typeof data5 !== "string") {
												validate123.errors = [{
													instancePath: instancePath + "/state",
													schemaPath: "#/$defs/MessageState/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											if (!(data5 === "visible" || data5 === "recalled" || data5 === "deleted")) {
												validate123.errors = [{
													instancePath: instancePath + "/state",
													schemaPath: "#/$defs/MessageState/enum",
													keyword: "enum",
													params: { allowedValues: schema172.enum },
													message: "must be equal to one of the allowed values"
												}];
												return false;
											}
											var valid0 = _errs12 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.parts !== void 0) {
												let data6 = data.parts;
												const _errs15 = errors;
												if (errors === _errs15) {
													if (Array.isArray(data6)) {
														const len0 = data6.length;
														for (let i0 = 0; i0 < len0; i0++) {
															let data7 = data6[i0];
															const _errs17 = errors;
															const _errs19 = errors;
															let valid5 = false;
															let passing0 = null;
															const _errs20 = errors;
															if (errors === _errs20) {
																if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
																	let missing1;
																	if (data7.kind === void 0 && (missing1 = "kind") || data7.text === void 0 && (missing1 = "text")) {
																		const err0 = {
																			instancePath: instancePath + "/parts/" + i0,
																			schemaPath: "#/$defs/MessagePart/oneOf/0/required",
																			keyword: "required",
																			params: { missingProperty: missing1 },
																			message: "must have required property '" + missing1 + "'"
																		};
																		if (vErrors === null) vErrors = [err0];
																		else vErrors.push(err0);
																		errors++;
																	} else {
																		const _errs22 = errors;
																		for (const key1 in data7) if (!(key1 === "kind" || key1 === "text")) {
																			const err1 = {
																				instancePath: instancePath + "/parts/" + i0,
																				schemaPath: "#/$defs/MessagePart/oneOf/0/additionalProperties",
																				keyword: "additionalProperties",
																				params: { additionalProperty: key1 },
																				message: "must NOT have additional properties"
																			};
																			if (vErrors === null) vErrors = [err1];
																			else vErrors.push(err1);
																			errors++;
																			break;
																		}
																		if (_errs22 === errors) {
																			if (data7.kind !== void 0) {
																				let data8 = data7.kind;
																				const _errs23 = errors;
																				if (typeof data8 !== "string") {
																					const err2 = {
																						instancePath: instancePath + "/parts/" + i0 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/type",
																						keyword: "type",
																						params: { type: "string" },
																						message: "must be string"
																					};
																					if (vErrors === null) vErrors = [err2];
																					else vErrors.push(err2);
																					errors++;
																				}
																				if ("text" !== data8) {
																					const err3 = {
																						instancePath: instancePath + "/parts/" + i0 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/const",
																						keyword: "const",
																						params: { allowedValue: "text" },
																						message: "must be equal to constant"
																					};
																					if (vErrors === null) vErrors = [err3];
																					else vErrors.push(err3);
																					errors++;
																				}
																				var valid6 = _errs23 === errors;
																			} else var valid6 = true;
																			if (valid6) {
																				if (data7.text !== void 0) {
																					const _errs25 = errors;
																					if (typeof data7.text !== "string") {
																						const err4 = {
																							instancePath: instancePath + "/parts/" + i0 + "/text",
																							schemaPath: "#/$defs/MessagePart/oneOf/0/properties/text/type",
																							keyword: "type",
																							params: { type: "string" },
																							message: "must be string"
																						};
																						if (vErrors === null) vErrors = [err4];
																						else vErrors.push(err4);
																						errors++;
																					}
																					var valid6 = _errs25 === errors;
																				} else var valid6 = true;
																			}
																		}
																	}
																} else {
																	const err5 = {
																		instancePath: instancePath + "/parts/" + i0,
																		schemaPath: "#/$defs/MessagePart/oneOf/0/type",
																		keyword: "type",
																		params: { type: "object" },
																		message: "must be object"
																	};
																	if (vErrors === null) vErrors = [err5];
																	else vErrors.push(err5);
																	errors++;
																}
															}
															var _valid0 = _errs20 === errors;
															if (_valid0) {
																valid5 = true;
																passing0 = 0;
																var props0 = true;
															}
															const _errs27 = errors;
															if (errors === _errs27) {
																if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
																	let missing2;
																	if (data7.kind === void 0 && (missing2 = "kind") || data7.attachment_id === void 0 && (missing2 = "attachment_id")) {
																		const err6 = {
																			instancePath: instancePath + "/parts/" + i0,
																			schemaPath: "#/$defs/MessagePart/oneOf/1/required",
																			keyword: "required",
																			params: { missingProperty: missing2 },
																			message: "must have required property '" + missing2 + "'"
																		};
																		if (vErrors === null) vErrors = [err6];
																		else vErrors.push(err6);
																		errors++;
																	} else {
																		const _errs29 = errors;
																		for (const key2 in data7) if (!(key2 === "kind" || key2 === "attachment_id")) {
																			const err7 = {
																				instancePath: instancePath + "/parts/" + i0,
																				schemaPath: "#/$defs/MessagePart/oneOf/1/additionalProperties",
																				keyword: "additionalProperties",
																				params: { additionalProperty: key2 },
																				message: "must NOT have additional properties"
																			};
																			if (vErrors === null) vErrors = [err7];
																			else vErrors.push(err7);
																			errors++;
																			break;
																		}
																		if (_errs29 === errors) {
																			if (data7.kind !== void 0) {
																				let data10 = data7.kind;
																				const _errs30 = errors;
																				if (typeof data10 !== "string") {
																					const err8 = {
																						instancePath: instancePath + "/parts/" + i0 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/type",
																						keyword: "type",
																						params: { type: "string" },
																						message: "must be string"
																					};
																					if (vErrors === null) vErrors = [err8];
																					else vErrors.push(err8);
																					errors++;
																				}
																				if ("attachment" !== data10) {
																					const err9 = {
																						instancePath: instancePath + "/parts/" + i0 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/const",
																						keyword: "const",
																						params: { allowedValue: "attachment" },
																						message: "must be equal to constant"
																					};
																					if (vErrors === null) vErrors = [err9];
																					else vErrors.push(err9);
																					errors++;
																				}
																				var valid7 = _errs30 === errors;
																			} else var valid7 = true;
																			if (valid7) {
																				if (data7.attachment_id !== void 0) {
																					const _errs32 = errors;
																					if (typeof data7.attachment_id !== "string") {
																						const err10 = {
																							instancePath: instancePath + "/parts/" + i0 + "/attachment_id",
																							schemaPath: "#/$defs/MessagePart/oneOf/1/properties/attachment_id/type",
																							keyword: "type",
																							params: { type: "string" },
																							message: "must be string"
																						};
																						if (vErrors === null) vErrors = [err10];
																						else vErrors.push(err10);
																						errors++;
																					}
																					var valid7 = _errs32 === errors;
																				} else var valid7 = true;
																			}
																		}
																	}
																} else {
																	const err11 = {
																		instancePath: instancePath + "/parts/" + i0,
																		schemaPath: "#/$defs/MessagePart/oneOf/1/type",
																		keyword: "type",
																		params: { type: "object" },
																		message: "must be object"
																	};
																	if (vErrors === null) vErrors = [err11];
																	else vErrors.push(err11);
																	errors++;
																}
															}
															var _valid0 = _errs27 === errors;
															if (_valid0 && valid5) {
																valid5 = false;
																passing0 = [passing0, 1];
															} else {
																if (_valid0) {
																	valid5 = true;
																	passing0 = 1;
																	if (props0 !== true) props0 = true;
																}
																const _errs34 = errors;
																if (errors === _errs34) {
																	if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
																		let missing3;
																		if (data7.kind === void 0 && (missing3 = "kind") || data7.emote_id === void 0 && (missing3 = "emote_id")) {
																			const err12 = {
																				instancePath: instancePath + "/parts/" + i0,
																				schemaPath: "#/$defs/MessagePart/oneOf/2/required",
																				keyword: "required",
																				params: { missingProperty: missing3 },
																				message: "must have required property '" + missing3 + "'"
																			};
																			if (vErrors === null) vErrors = [err12];
																			else vErrors.push(err12);
																			errors++;
																		} else {
																			const _errs36 = errors;
																			for (const key3 in data7) if (!(key3 === "kind" || key3 === "emote_id")) {
																				const err13 = {
																					instancePath: instancePath + "/parts/" + i0,
																					schemaPath: "#/$defs/MessagePart/oneOf/2/additionalProperties",
																					keyword: "additionalProperties",
																					params: { additionalProperty: key3 },
																					message: "must NOT have additional properties"
																				};
																				if (vErrors === null) vErrors = [err13];
																				else vErrors.push(err13);
																				errors++;
																				break;
																			}
																			if (_errs36 === errors) {
																				if (data7.kind !== void 0) {
																					let data12 = data7.kind;
																					const _errs37 = errors;
																					if (typeof data12 !== "string") {
																						const err14 = {
																							instancePath: instancePath + "/parts/" + i0 + "/kind",
																							schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/type",
																							keyword: "type",
																							params: { type: "string" },
																							message: "must be string"
																						};
																						if (vErrors === null) vErrors = [err14];
																						else vErrors.push(err14);
																						errors++;
																					}
																					if ("emote" !== data12) {
																						const err15 = {
																							instancePath: instancePath + "/parts/" + i0 + "/kind",
																							schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/const",
																							keyword: "const",
																							params: { allowedValue: "emote" },
																							message: "must be equal to constant"
																						};
																						if (vErrors === null) vErrors = [err15];
																						else vErrors.push(err15);
																						errors++;
																					}
																					var valid8 = _errs37 === errors;
																				} else var valid8 = true;
																				if (valid8) {
																					if (data7.emote_id !== void 0) {
																						const _errs39 = errors;
																						if (typeof data7.emote_id !== "string") {
																							const err16 = {
																								instancePath: instancePath + "/parts/" + i0 + "/emote_id",
																								schemaPath: "#/$defs/MessagePart/oneOf/2/properties/emote_id/type",
																								keyword: "type",
																								params: { type: "string" },
																								message: "must be string"
																							};
																							if (vErrors === null) vErrors = [err16];
																							else vErrors.push(err16);
																							errors++;
																						}
																						var valid8 = _errs39 === errors;
																					} else var valid8 = true;
																				}
																			}
																		}
																	} else {
																		const err17 = {
																			instancePath: instancePath + "/parts/" + i0,
																			schemaPath: "#/$defs/MessagePart/oneOf/2/type",
																			keyword: "type",
																			params: { type: "object" },
																			message: "must be object"
																		};
																		if (vErrors === null) vErrors = [err17];
																		else vErrors.push(err17);
																		errors++;
																	}
																}
																var _valid0 = _errs34 === errors;
																if (_valid0 && valid5) {
																	valid5 = false;
																	passing0 = [passing0, 2];
																} else if (_valid0) {
																	valid5 = true;
																	passing0 = 2;
																	if (props0 !== true) props0 = true;
																}
															}
															if (!valid5) {
																const err18 = {
																	instancePath: instancePath + "/parts/" + i0,
																	schemaPath: "#/$defs/MessagePart/oneOf",
																	keyword: "oneOf",
																	params: { passingSchemas: passing0 },
																	message: "must match exactly one schema in oneOf"
																};
																if (vErrors === null) vErrors = [err18];
																else vErrors.push(err18);
																errors++;
																validate123.errors = vErrors;
																return false;
															} else {
																errors = _errs19;
																if (vErrors !== null) {
																	if (_errs19) vErrors.length = _errs19;
																	else vErrors = null;
																}
															}
															if (!(_errs17 === errors)) break;
														}
													} else {
														validate123.errors = [{
															instancePath: instancePath + "/parts",
															schemaPath: "#/properties/parts/type",
															keyword: "type",
															params: { type: "array" },
															message: "must be array"
														}];
														return false;
													}
												}
												var valid0 = _errs15 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.quote_message_id !== void 0) {
													let data14 = data.quote_message_id;
													const _errs41 = errors;
													if (typeof data14 !== "string" && data14 !== null) {
														validate123.errors = [{
															instancePath: instancePath + "/quote_message_id",
															schemaPath: "#/properties/quote_message_id/type",
															keyword: "type",
															params: { type: schema168.properties.quote_message_id.type },
															message: "must be string,null"
														}];
														return false;
													}
													var valid0 = _errs41 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.mention_ids !== void 0) {
														let data15 = data.mention_ids;
														const _errs43 = errors;
														if (errors === _errs43) {
															if (Array.isArray(data15)) {
																const len1 = data15.length;
																for (let i1 = 0; i1 < len1; i1++) {
																	const _errs45 = errors;
																	if (typeof data15[i1] !== "string") {
																		validate123.errors = [{
																			instancePath: instancePath + "/mention_ids/" + i1,
																			schemaPath: "#/properties/mention_ids/items/type",
																			keyword: "type",
																			params: { type: "string" },
																			message: "must be string"
																		}];
																		return false;
																	}
																	if (!(_errs45 === errors)) break;
																}
															} else {
																validate123.errors = [{
																	instancePath: instancePath + "/mention_ids",
																	schemaPath: "#/properties/mention_ids/type",
																	keyword: "type",
																	params: { type: "array" },
																	message: "must be array"
																}];
																return false;
															}
														}
														var valid0 = _errs43 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.mention_all !== void 0) {
															const _errs47 = errors;
															if (typeof data.mention_all !== "boolean") {
																validate123.errors = [{
																	instancePath: instancePath + "/mention_all",
																	schemaPath: "#/properties/mention_all/type",
																	keyword: "type",
																	params: { type: "boolean" },
																	message: "must be boolean"
																}];
																return false;
															}
															var valid0 = _errs47 === errors;
														} else var valid0 = true;
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate123.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate123.errors = vErrors;
	return errors === 0;
}
validate123.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate122(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate122.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.items === void 0 && (missing0 = "items") || data.first_seq === void 0 && (missing0 = "first_seq") || data.last_seq === void 0 && (missing0 = "last_seq") || data.has_more_before === void 0 && (missing0 = "has_more_before") || data.has_more_after === void 0 && (missing0 = "has_more_after") || data.latest_message_seq === void 0 && (missing0 = "latest_message_seq") || data.latest_event_seq === void 0 && (missing0 = "latest_event_seq")) {
				validate122.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "items" || key0 === "first_seq" || key0 === "last_seq" || key0 === "has_more_before" || key0 === "has_more_after" || key0 === "latest_message_seq" || key0 === "latest_event_seq")) {
					validate122.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate122.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.items !== void 0) {
							let data1 = data.items;
							const _errs4 = errors;
							if (errors === _errs4) {
								if (Array.isArray(data1)) {
									const len0 = data1.length;
									for (let i0 = 0; i0 < len0; i0++) {
										const _errs6 = errors;
										if (!validate123(data1[i0], {
											instancePath: instancePath + "/items/" + i0,
											parentData: data1,
											parentDataProperty: i0,
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate123.errors : vErrors.concat(validate123.errors);
											errors = vErrors.length;
										}
										if (!(_errs6 === errors)) break;
									}
								} else {
									validate122.errors = [{
										instancePath: instancePath + "/items",
										schemaPath: "#/properties/items/type",
										keyword: "type",
										params: { type: "array" },
										message: "must be array"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.first_seq !== void 0) {
								let data3 = data.first_seq;
								const _errs7 = errors;
								const _errs8 = errors;
								let valid2 = false;
								const _errs9 = errors;
								if (errors === errors) {
									if (typeof data3 === "string") {
										if (func2(data3) > 19) {
											const err0 = {
												instancePath: instancePath + "/first_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err0];
											else vErrors.push(err0);
											errors++;
										} else if (!pattern4.test(data3)) {
											const err1 = {
												instancePath: instancePath + "/first_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err1];
											else vErrors.push(err1);
											errors++;
										}
									} else {
										const err2 = {
											instancePath: instancePath + "/first_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err2];
										else vErrors.push(err2);
										errors++;
									}
								}
								var _valid0 = _errs9 === errors;
								valid2 = valid2 || _valid0;
								const _errs12 = errors;
								if (data3 !== null) {
									const err3 = {
										instancePath: instancePath + "/first_seq",
										schemaPath: "#/properties/first_seq/anyOf/1/type",
										keyword: "type",
										params: { type: "null" },
										message: "must be null"
									};
									if (vErrors === null) vErrors = [err3];
									else vErrors.push(err3);
									errors++;
								}
								var _valid0 = _errs12 === errors;
								valid2 = valid2 || _valid0;
								if (!valid2) {
									const err4 = {
										instancePath: instancePath + "/first_seq",
										schemaPath: "#/properties/first_seq/anyOf",
										keyword: "anyOf",
										params: {},
										message: "must match a schema in anyOf"
									};
									if (vErrors === null) vErrors = [err4];
									else vErrors.push(err4);
									errors++;
									validate122.errors = vErrors;
									return false;
								} else {
									errors = _errs8;
									if (vErrors !== null) {
										if (_errs8) vErrors.length = _errs8;
										else vErrors = null;
									}
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.last_seq !== void 0) {
									let data4 = data.last_seq;
									const _errs14 = errors;
									const _errs15 = errors;
									let valid4 = false;
									const _errs16 = errors;
									if (errors === errors) {
										if (typeof data4 === "string") {
											if (func2(data4) > 19) {
												const err5 = {
													instancePath: instancePath + "/last_seq",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												};
												if (vErrors === null) vErrors = [err5];
												else vErrors.push(err5);
												errors++;
											} else if (!pattern4.test(data4)) {
												const err6 = {
													instancePath: instancePath + "/last_seq",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												};
												if (vErrors === null) vErrors = [err6];
												else vErrors.push(err6);
												errors++;
											}
										} else {
											const err7 = {
												instancePath: instancePath + "/last_seq",
												schemaPath: "#/$defs/DecimalString/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											};
											if (vErrors === null) vErrors = [err7];
											else vErrors.push(err7);
											errors++;
										}
									}
									var _valid1 = _errs16 === errors;
									valid4 = valid4 || _valid1;
									const _errs19 = errors;
									if (data4 !== null) {
										const err8 = {
											instancePath: instancePath + "/last_seq",
											schemaPath: "#/properties/last_seq/anyOf/1/type",
											keyword: "type",
											params: { type: "null" },
											message: "must be null"
										};
										if (vErrors === null) vErrors = [err8];
										else vErrors.push(err8);
										errors++;
									}
									var _valid1 = _errs19 === errors;
									valid4 = valid4 || _valid1;
									if (!valid4) {
										const err9 = {
											instancePath: instancePath + "/last_seq",
											schemaPath: "#/properties/last_seq/anyOf",
											keyword: "anyOf",
											params: {},
											message: "must match a schema in anyOf"
										};
										if (vErrors === null) vErrors = [err9];
										else vErrors.push(err9);
										errors++;
										validate122.errors = vErrors;
										return false;
									} else {
										errors = _errs15;
										if (vErrors !== null) {
											if (_errs15) vErrors.length = _errs15;
											else vErrors = null;
										}
									}
									var valid0 = _errs14 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.has_more_before !== void 0) {
										const _errs21 = errors;
										if (typeof data.has_more_before !== "boolean") {
											validate122.errors = [{
												instancePath: instancePath + "/has_more_before",
												schemaPath: "#/properties/has_more_before/type",
												keyword: "type",
												params: { type: "boolean" },
												message: "must be boolean"
											}];
											return false;
										}
										var valid0 = _errs21 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.has_more_after !== void 0) {
											const _errs23 = errors;
											if (typeof data.has_more_after !== "boolean") {
												validate122.errors = [{
													instancePath: instancePath + "/has_more_after",
													schemaPath: "#/properties/has_more_after/type",
													keyword: "type",
													params: { type: "boolean" },
													message: "must be boolean"
												}];
												return false;
											}
											var valid0 = _errs23 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.latest_message_seq !== void 0) {
												let data7 = data.latest_message_seq;
												const _errs25 = errors;
												if (errors === errors) {
													if (typeof data7 === "string") {
														if (func2(data7) > 19) {
															validate122.errors = [{
																instancePath: instancePath + "/latest_message_seq",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data7)) {
															validate122.errors = [{
																instancePath: instancePath + "/latest_message_seq",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate122.errors = [{
															instancePath: instancePath + "/latest_message_seq",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs25 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.latest_event_seq !== void 0) {
													let data8 = data.latest_event_seq;
													const _errs28 = errors;
													if (errors === errors) {
														if (typeof data8 === "string") {
															if (func2(data8) > 19) {
																validate122.errors = [{
																	instancePath: instancePath + "/latest_event_seq",
																	schemaPath: "#/$defs/DecimalString/maxLength",
																	keyword: "maxLength",
																	params: { limit: 19 },
																	message: "must NOT have more than 19 characters"
																}];
																return false;
															} else if (!pattern4.test(data8)) {
																validate122.errors = [{
																	instancePath: instancePath + "/latest_event_seq",
																	schemaPath: "#/$defs/DecimalString/pattern",
																	keyword: "pattern",
																	params: { pattern: "^(0|[1-9][0-9]*)$" },
																	message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																}];
																return false;
															}
														} else {
															validate122.errors = [{
																instancePath: instancePath + "/latest_event_seq",
																schemaPath: "#/$defs/DecimalString/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
													}
													var valid0 = _errs28 === errors;
												} else var valid0 = true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate122.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate122.errors = vErrors;
	return errors === 0;
}
validate122.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate121(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate121.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate121.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate121.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate121.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate121.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema166.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate122(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate122.errors : vErrors.concat(validate122.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate121.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate121.errors = vErrors;
	return errors === 0;
}
validate121.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema180 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema181 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema182 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate130(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate130.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate130.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate130.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate130.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate130.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema181.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate130.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate130.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate130.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema182.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate130.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema180.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate130.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate130.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate130.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate130.errors = vErrors;
	return true;
}
validate130.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate129(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate129.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate129.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate129.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate129.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate129.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema166.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate130(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate130.errors : vErrors.concat(validate130.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate129.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate129.errors = vErrors;
	return errors === 0;
}
validate129.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate120(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate120.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate121(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate121.errors : vErrors.concat(validate121.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate129(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate129.errors : vErrors.concat(validate129.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate120.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate120.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate120.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateChatSearchRequest = validate133;
var schema183 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"title": "ChatSearchRequest",
	"type": "object",
	"properties": {
		"data_generation_id": { "type": "string" },
		"search_id": { "type": "string" },
		"query": {
			"type": "string",
			"minLength": 1,
			"maxLength": 256
		},
		"cursor": {
			"type": ["string", "null"],
			"default": null
		},
		"limit": {
			"type": "integer",
			"format": "uint32",
			"minimum": 1,
			"maximum": 200
		}
	},
	"additionalProperties": false,
	"required": [
		"data_generation_id",
		"search_id",
		"query",
		"limit"
	]
};
function validate133(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate133.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id") || data.query === void 0 && (missing0 = "query") || data.limit === void 0 && (missing0 = "limit")) {
			validate133.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "search_id" || key0 === "query" || key0 === "cursor" || key0 === "limit")) {
				validate133.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate133.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.search_id !== void 0) {
					if (typeof data.search_id !== "string") {
						validate133.errors = [{
							instancePath: instancePath + "/search_id",
							schemaPath: "#/properties/search_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.query !== void 0) {
						let data2 = data.query;
						if (typeof data2 === "string") {
							if (func2(data2) > 256) {
								validate133.errors = [{
									instancePath: instancePath + "/query",
									schemaPath: "#/properties/query/maxLength",
									keyword: "maxLength",
									params: { limit: 256 },
									message: "must NOT have more than 256 characters"
								}];
								return false;
							} else if (func2(data2) < 1) {
								validate133.errors = [{
									instancePath: instancePath + "/query",
									schemaPath: "#/properties/query/minLength",
									keyword: "minLength",
									params: { limit: 1 },
									message: "must NOT have fewer than 1 characters"
								}];
								return false;
							}
						} else {
							validate133.errors = [{
								instancePath: instancePath + "/query",
								schemaPath: "#/properties/query/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.cursor !== void 0) {
							let data3 = data.cursor;
							if (typeof data3 !== "string" && data3 !== null) {
								validate133.errors = [{
									instancePath: instancePath + "/cursor",
									schemaPath: "#/properties/cursor/type",
									keyword: "type",
									params: { type: schema183.properties.cursor.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.limit !== void 0) {
								let data4 = data.limit;
								if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
									validate133.errors = [{
										instancePath: instancePath + "/limit",
										schemaPath: "#/properties/limit/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (typeof data4 == "number" && isFinite(data4)) {
									if (data4 > 200 || isNaN(data4)) {
										validate133.errors = [{
											instancePath: instancePath + "/limit",
											schemaPath: "#/properties/limit/maximum",
											keyword: "maximum",
											params: {
												comparison: "<=",
												limit: 200
											},
											message: "must be <= 200"
										}];
										return false;
									} else if (data4 < 1 || isNaN(data4)) {
										validate133.errors = [{
											instancePath: instancePath + "/limit",
											schemaPath: "#/properties/limit/minimum",
											keyword: "minimum",
											params: {
												comparison: ">=",
												limit: 1
											},
											message: "must be >= 1"
										}];
										return false;
									}
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate133.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate133.errors = vErrors;
	return true;
}
validate133.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateChatSearchResponse = validate134;
var schema186 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema187 = {
	"type": "object",
	"properties": {
		"data_generation_id": { "type": "string" },
		"search_id": { "type": "string" },
		"query": { "type": "string" },
		"semantics": { "$ref": "#/$defs/SearchSemantics" },
		"items": {
			"type": "array",
			"items": { "$ref": "#/$defs/SearchHit" }
		},
		"has_more": { "type": "boolean" },
		"next_cursor": { "type": ["string", "null"] }
	},
	"additionalProperties": false,
	"required": [
		"data_generation_id",
		"search_id",
		"query",
		"semantics",
		"items",
		"has_more",
		"next_cursor"
	]
};
var schema188 = {
	"type": "string",
	"enum": ["literal_unicode_substring"]
};
function validate137(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate137.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.message_id === void 0 && (missing0 = "message_id") || data.seq === void 0 && (missing0 = "seq") || data.sender_display_name === void 0 && (missing0 = "sender_display_name") || data.snippet === void 0 && (missing0 = "snippet") || data.created_at === void 0 && (missing0 = "created_at")) {
			validate137.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "message_id" || key0 === "seq" || key0 === "sender_display_name" || key0 === "snippet" || key0 === "created_at")) {
				validate137.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.message_id !== void 0) {
				if (typeof data.message_id !== "string") {
					validate137.errors = [{
						instancePath: instancePath + "/message_id",
						schemaPath: "#/properties/message_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.seq !== void 0) {
					let data1 = data.seq;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate137.errors = [{
								instancePath: instancePath + "/seq",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate137.errors = [{
								instancePath: instancePath + "/seq",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate137.errors = [{
							instancePath: instancePath + "/seq",
							schemaPath: "#/$defs/DecimalString/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.sender_display_name !== void 0) {
						if (typeof data.sender_display_name !== "string") {
							validate137.errors = [{
								instancePath: instancePath + "/sender_display_name",
								schemaPath: "#/properties/sender_display_name/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.snippet !== void 0) {
							if (typeof data.snippet !== "string") {
								validate137.errors = [{
									instancePath: instancePath + "/snippet",
									schemaPath: "#/properties/snippet/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.created_at !== void 0) {
								let data4 = data.created_at;
								if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
									validate137.errors = [{
										instancePath: instancePath + "/created_at",
										schemaPath: "#/properties/created_at/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (typeof data4 == "number" && isFinite(data4)) {
									if (data4 > 9007199254740991 || isNaN(data4)) {
										validate137.errors = [{
											instancePath: instancePath + "/created_at",
											schemaPath: "#/properties/created_at/maximum",
											keyword: "maximum",
											params: {
												comparison: "<=",
												limit: 9007199254740991
											},
											message: "must be <= 9007199254740991"
										}];
										return false;
									} else if (data4 < -9007199254740991 || isNaN(data4)) {
										validate137.errors = [{
											instancePath: instancePath + "/created_at",
											schemaPath: "#/properties/created_at/minimum",
											keyword: "minimum",
											params: {
												comparison: ">=",
												limit: -9007199254740991
											},
											message: "must be >= -9007199254740991"
										}];
										return false;
									}
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate137.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate137.errors = vErrors;
	return true;
}
validate137.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate136(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate136.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id") || data.query === void 0 && (missing0 = "query") || data.semantics === void 0 && (missing0 = "semantics") || data.items === void 0 && (missing0 = "items") || data.has_more === void 0 && (missing0 = "has_more") || data.next_cursor === void 0 && (missing0 = "next_cursor")) {
				validate136.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "search_id" || key0 === "query" || key0 === "semantics" || key0 === "items" || key0 === "has_more" || key0 === "next_cursor")) {
					validate136.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate136.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.search_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.search_id !== "string") {
								validate136.errors = [{
									instancePath: instancePath + "/search_id",
									schemaPath: "#/properties/search_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.query !== void 0) {
								const _errs6 = errors;
								if (typeof data.query !== "string") {
									validate136.errors = [{
										instancePath: instancePath + "/query",
										schemaPath: "#/properties/query/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.semantics !== void 0) {
									let data3 = data.semantics;
									const _errs8 = errors;
									if (typeof data3 !== "string") {
										validate136.errors = [{
											instancePath: instancePath + "/semantics",
											schemaPath: "#/$defs/SearchSemantics/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									if (!(data3 === "literal_unicode_substring")) {
										validate136.errors = [{
											instancePath: instancePath + "/semantics",
											schemaPath: "#/$defs/SearchSemantics/enum",
											keyword: "enum",
											params: { allowedValues: schema188.enum },
											message: "must be equal to one of the allowed values"
										}];
										return false;
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.items !== void 0) {
										let data4 = data.items;
										const _errs11 = errors;
										if (errors === _errs11) {
											if (Array.isArray(data4)) {
												const len0 = data4.length;
												for (let i0 = 0; i0 < len0; i0++) {
													const _errs13 = errors;
													if (!validate137(data4[i0], {
														instancePath: instancePath + "/items/" + i0,
														parentData: data4,
														parentDataProperty: i0,
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate137.errors : vErrors.concat(validate137.errors);
														errors = vErrors.length;
													}
													if (!(_errs13 === errors)) break;
												}
											} else {
												validate136.errors = [{
													instancePath: instancePath + "/items",
													schemaPath: "#/properties/items/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.has_more !== void 0) {
											const _errs14 = errors;
											if (typeof data.has_more !== "boolean") {
												validate136.errors = [{
													instancePath: instancePath + "/has_more",
													schemaPath: "#/properties/has_more/type",
													keyword: "type",
													params: { type: "boolean" },
													message: "must be boolean"
												}];
												return false;
											}
											var valid0 = _errs14 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.next_cursor !== void 0) {
												let data7 = data.next_cursor;
												const _errs16 = errors;
												if (typeof data7 !== "string" && data7 !== null) {
													validate136.errors = [{
														instancePath: instancePath + "/next_cursor",
														schemaPath: "#/properties/next_cursor/type",
														keyword: "type",
														params: { type: schema187.properties.next_cursor.type },
														message: "must be string,null"
													}];
													return false;
												}
												var valid0 = _errs16 === errors;
											} else var valid0 = true;
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate136.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate136.errors = vErrors;
	return errors === 0;
}
validate136.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate135(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate135.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate135.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate135.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate135.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate135.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema186.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate136(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate136.errors : vErrors.concat(validate136.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate135.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate135.errors = vErrors;
	return errors === 0;
}
validate135.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema193 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema194 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema195 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate142(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate142.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate142.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate142.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate142.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate142.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema194.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate142.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate142.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate142.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema195.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate142.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema193.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate142.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate142.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate142.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate142.errors = vErrors;
	return true;
}
validate142.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate141(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate141.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate141.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate141.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate141.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate141.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema186.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate142(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate142.errors : vErrors.concat(validate142.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate141.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate141.errors = vErrors;
	return errors === 0;
}
validate141.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate134(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate134.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate135(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate135.errors : vErrors.concat(validate135.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate141(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate141.errors : vErrors.concat(validate141.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate134.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate134.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate134.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateChatSendRequest = validate145;
var schema196 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"title": "ChatSendRequest",
	"type": "object",
	"properties": {
		"data_generation_id": { "type": "string" },
		"client_request_id": { "type": "string" },
		"parts": {
			"type": "array",
			"items": { "$ref": "#/$defs/MessagePart" }
		},
		"quote_message_id": {
			"type": ["string", "null"],
			"default": null
		},
		"mention_ids": {
			"type": "array",
			"items": { "type": "string" }
		},
		"mention_all": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"data_generation_id",
		"client_request_id",
		"parts",
		"mention_ids",
		"mention_all"
	],
	"$defs": { "MessagePart": { "oneOf": [
		{
			"type": "object",
			"properties": {
				"kind": {
					"type": "string",
					"const": "text"
				},
				"text": { "type": "string" }
			},
			"additionalProperties": false,
			"required": ["kind", "text"]
		},
		{
			"type": "object",
			"properties": {
				"kind": {
					"type": "string",
					"const": "attachment"
				},
				"attachment_id": { "type": "string" }
			},
			"additionalProperties": false,
			"required": ["kind", "attachment_id"]
		},
		{
			"type": "object",
			"properties": {
				"kind": {
					"type": "string",
					"const": "emote"
				},
				"emote_id": { "type": "string" }
			},
			"additionalProperties": false,
			"required": ["kind", "emote_id"]
		}
	] } }
};
function validate145(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate145.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.parts === void 0 && (missing0 = "parts") || data.mention_ids === void 0 && (missing0 = "mention_ids") || data.mention_all === void 0 && (missing0 = "mention_all")) {
				validate145.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "client_request_id" || key0 === "parts" || key0 === "quote_message_id" || key0 === "mention_ids" || key0 === "mention_all")) {
					validate145.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate145.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.client_request_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.client_request_id !== "string") {
								validate145.errors = [{
									instancePath: instancePath + "/client_request_id",
									schemaPath: "#/properties/client_request_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.parts !== void 0) {
								let data2 = data.parts;
								const _errs6 = errors;
								if (errors === _errs6) {
									if (Array.isArray(data2)) {
										const len0 = data2.length;
										for (let i0 = 0; i0 < len0; i0++) {
											let data3 = data2[i0];
											const _errs8 = errors;
											const _errs10 = errors;
											let valid3 = false;
											let passing0 = null;
											const _errs11 = errors;
											if (errors === _errs11) {
												if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
													let missing1;
													if (data3.kind === void 0 && (missing1 = "kind") || data3.text === void 0 && (missing1 = "text")) {
														const err0 = {
															instancePath: instancePath + "/parts/" + i0,
															schemaPath: "#/$defs/MessagePart/oneOf/0/required",
															keyword: "required",
															params: { missingProperty: missing1 },
															message: "must have required property '" + missing1 + "'"
														};
														if (vErrors === null) vErrors = [err0];
														else vErrors.push(err0);
														errors++;
													} else {
														const _errs13 = errors;
														for (const key1 in data3) if (!(key1 === "kind" || key1 === "text")) {
															const err1 = {
																instancePath: instancePath + "/parts/" + i0,
																schemaPath: "#/$defs/MessagePart/oneOf/0/additionalProperties",
																keyword: "additionalProperties",
																params: { additionalProperty: key1 },
																message: "must NOT have additional properties"
															};
															if (vErrors === null) vErrors = [err1];
															else vErrors.push(err1);
															errors++;
															break;
														}
														if (_errs13 === errors) {
															if (data3.kind !== void 0) {
																let data4 = data3.kind;
																const _errs14 = errors;
																if (typeof data4 !== "string") {
																	const err2 = {
																		instancePath: instancePath + "/parts/" + i0 + "/kind",
																		schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/type",
																		keyword: "type",
																		params: { type: "string" },
																		message: "must be string"
																	};
																	if (vErrors === null) vErrors = [err2];
																	else vErrors.push(err2);
																	errors++;
																}
																if ("text" !== data4) {
																	const err3 = {
																		instancePath: instancePath + "/parts/" + i0 + "/kind",
																		schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/const",
																		keyword: "const",
																		params: { allowedValue: "text" },
																		message: "must be equal to constant"
																	};
																	if (vErrors === null) vErrors = [err3];
																	else vErrors.push(err3);
																	errors++;
																}
																var valid4 = _errs14 === errors;
															} else var valid4 = true;
															if (valid4) {
																if (data3.text !== void 0) {
																	const _errs16 = errors;
																	if (typeof data3.text !== "string") {
																		const err4 = {
																			instancePath: instancePath + "/parts/" + i0 + "/text",
																			schemaPath: "#/$defs/MessagePart/oneOf/0/properties/text/type",
																			keyword: "type",
																			params: { type: "string" },
																			message: "must be string"
																		};
																		if (vErrors === null) vErrors = [err4];
																		else vErrors.push(err4);
																		errors++;
																	}
																	var valid4 = _errs16 === errors;
																} else var valid4 = true;
															}
														}
													}
												} else {
													const err5 = {
														instancePath: instancePath + "/parts/" + i0,
														schemaPath: "#/$defs/MessagePart/oneOf/0/type",
														keyword: "type",
														params: { type: "object" },
														message: "must be object"
													};
													if (vErrors === null) vErrors = [err5];
													else vErrors.push(err5);
													errors++;
												}
											}
											var _valid0 = _errs11 === errors;
											if (_valid0) {
												valid3 = true;
												passing0 = 0;
												var props0 = true;
											}
											const _errs18 = errors;
											if (errors === _errs18) {
												if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
													let missing2;
													if (data3.kind === void 0 && (missing2 = "kind") || data3.attachment_id === void 0 && (missing2 = "attachment_id")) {
														const err6 = {
															instancePath: instancePath + "/parts/" + i0,
															schemaPath: "#/$defs/MessagePart/oneOf/1/required",
															keyword: "required",
															params: { missingProperty: missing2 },
															message: "must have required property '" + missing2 + "'"
														};
														if (vErrors === null) vErrors = [err6];
														else vErrors.push(err6);
														errors++;
													} else {
														const _errs20 = errors;
														for (const key2 in data3) if (!(key2 === "kind" || key2 === "attachment_id")) {
															const err7 = {
																instancePath: instancePath + "/parts/" + i0,
																schemaPath: "#/$defs/MessagePart/oneOf/1/additionalProperties",
																keyword: "additionalProperties",
																params: { additionalProperty: key2 },
																message: "must NOT have additional properties"
															};
															if (vErrors === null) vErrors = [err7];
															else vErrors.push(err7);
															errors++;
															break;
														}
														if (_errs20 === errors) {
															if (data3.kind !== void 0) {
																let data6 = data3.kind;
																const _errs21 = errors;
																if (typeof data6 !== "string") {
																	const err8 = {
																		instancePath: instancePath + "/parts/" + i0 + "/kind",
																		schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/type",
																		keyword: "type",
																		params: { type: "string" },
																		message: "must be string"
																	};
																	if (vErrors === null) vErrors = [err8];
																	else vErrors.push(err8);
																	errors++;
																}
																if ("attachment" !== data6) {
																	const err9 = {
																		instancePath: instancePath + "/parts/" + i0 + "/kind",
																		schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/const",
																		keyword: "const",
																		params: { allowedValue: "attachment" },
																		message: "must be equal to constant"
																	};
																	if (vErrors === null) vErrors = [err9];
																	else vErrors.push(err9);
																	errors++;
																}
																var valid5 = _errs21 === errors;
															} else var valid5 = true;
															if (valid5) {
																if (data3.attachment_id !== void 0) {
																	const _errs23 = errors;
																	if (typeof data3.attachment_id !== "string") {
																		const err10 = {
																			instancePath: instancePath + "/parts/" + i0 + "/attachment_id",
																			schemaPath: "#/$defs/MessagePart/oneOf/1/properties/attachment_id/type",
																			keyword: "type",
																			params: { type: "string" },
																			message: "must be string"
																		};
																		if (vErrors === null) vErrors = [err10];
																		else vErrors.push(err10);
																		errors++;
																	}
																	var valid5 = _errs23 === errors;
																} else var valid5 = true;
															}
														}
													}
												} else {
													const err11 = {
														instancePath: instancePath + "/parts/" + i0,
														schemaPath: "#/$defs/MessagePart/oneOf/1/type",
														keyword: "type",
														params: { type: "object" },
														message: "must be object"
													};
													if (vErrors === null) vErrors = [err11];
													else vErrors.push(err11);
													errors++;
												}
											}
											var _valid0 = _errs18 === errors;
											if (_valid0 && valid3) {
												valid3 = false;
												passing0 = [passing0, 1];
											} else {
												if (_valid0) {
													valid3 = true;
													passing0 = 1;
													if (props0 !== true) props0 = true;
												}
												const _errs25 = errors;
												if (errors === _errs25) {
													if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
														let missing3;
														if (data3.kind === void 0 && (missing3 = "kind") || data3.emote_id === void 0 && (missing3 = "emote_id")) {
															const err12 = {
																instancePath: instancePath + "/parts/" + i0,
																schemaPath: "#/$defs/MessagePart/oneOf/2/required",
																keyword: "required",
																params: { missingProperty: missing3 },
																message: "must have required property '" + missing3 + "'"
															};
															if (vErrors === null) vErrors = [err12];
															else vErrors.push(err12);
															errors++;
														} else {
															const _errs27 = errors;
															for (const key3 in data3) if (!(key3 === "kind" || key3 === "emote_id")) {
																const err13 = {
																	instancePath: instancePath + "/parts/" + i0,
																	schemaPath: "#/$defs/MessagePart/oneOf/2/additionalProperties",
																	keyword: "additionalProperties",
																	params: { additionalProperty: key3 },
																	message: "must NOT have additional properties"
																};
																if (vErrors === null) vErrors = [err13];
																else vErrors.push(err13);
																errors++;
																break;
															}
															if (_errs27 === errors) {
																if (data3.kind !== void 0) {
																	let data8 = data3.kind;
																	const _errs28 = errors;
																	if (typeof data8 !== "string") {
																		const err14 = {
																			instancePath: instancePath + "/parts/" + i0 + "/kind",
																			schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/type",
																			keyword: "type",
																			params: { type: "string" },
																			message: "must be string"
																		};
																		if (vErrors === null) vErrors = [err14];
																		else vErrors.push(err14);
																		errors++;
																	}
																	if ("emote" !== data8) {
																		const err15 = {
																			instancePath: instancePath + "/parts/" + i0 + "/kind",
																			schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/const",
																			keyword: "const",
																			params: { allowedValue: "emote" },
																			message: "must be equal to constant"
																		};
																		if (vErrors === null) vErrors = [err15];
																		else vErrors.push(err15);
																		errors++;
																	}
																	var valid6 = _errs28 === errors;
																} else var valid6 = true;
																if (valid6) {
																	if (data3.emote_id !== void 0) {
																		const _errs30 = errors;
																		if (typeof data3.emote_id !== "string") {
																			const err16 = {
																				instancePath: instancePath + "/parts/" + i0 + "/emote_id",
																				schemaPath: "#/$defs/MessagePart/oneOf/2/properties/emote_id/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err16];
																			else vErrors.push(err16);
																			errors++;
																		}
																		var valid6 = _errs30 === errors;
																	} else var valid6 = true;
																}
															}
														}
													} else {
														const err17 = {
															instancePath: instancePath + "/parts/" + i0,
															schemaPath: "#/$defs/MessagePart/oneOf/2/type",
															keyword: "type",
															params: { type: "object" },
															message: "must be object"
														};
														if (vErrors === null) vErrors = [err17];
														else vErrors.push(err17);
														errors++;
													}
												}
												var _valid0 = _errs25 === errors;
												if (_valid0 && valid3) {
													valid3 = false;
													passing0 = [passing0, 2];
												} else if (_valid0) {
													valid3 = true;
													passing0 = 2;
													if (props0 !== true) props0 = true;
												}
											}
											if (!valid3) {
												const err18 = {
													instancePath: instancePath + "/parts/" + i0,
													schemaPath: "#/$defs/MessagePart/oneOf",
													keyword: "oneOf",
													params: { passingSchemas: passing0 },
													message: "must match exactly one schema in oneOf"
												};
												if (vErrors === null) vErrors = [err18];
												else vErrors.push(err18);
												errors++;
												validate145.errors = vErrors;
												return false;
											} else {
												errors = _errs10;
												if (vErrors !== null) {
													if (_errs10) vErrors.length = _errs10;
													else vErrors = null;
												}
											}
											if (!(_errs8 === errors)) break;
										}
									} else {
										validate145.errors = [{
											instancePath: instancePath + "/parts",
											schemaPath: "#/properties/parts/type",
											keyword: "type",
											params: { type: "array" },
											message: "must be array"
										}];
										return false;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.quote_message_id !== void 0) {
									let data10 = data.quote_message_id;
									const _errs32 = errors;
									if (typeof data10 !== "string" && data10 !== null) {
										validate145.errors = [{
											instancePath: instancePath + "/quote_message_id",
											schemaPath: "#/properties/quote_message_id/type",
											keyword: "type",
											params: { type: schema196.properties.quote_message_id.type },
											message: "must be string,null"
										}];
										return false;
									}
									var valid0 = _errs32 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.mention_ids !== void 0) {
										let data11 = data.mention_ids;
										const _errs34 = errors;
										if (errors === _errs34) {
											if (Array.isArray(data11)) {
												const len1 = data11.length;
												for (let i1 = 0; i1 < len1; i1++) {
													const _errs36 = errors;
													if (typeof data11[i1] !== "string") {
														validate145.errors = [{
															instancePath: instancePath + "/mention_ids/" + i1,
															schemaPath: "#/properties/mention_ids/items/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
													if (!(_errs36 === errors)) break;
												}
											} else {
												validate145.errors = [{
													instancePath: instancePath + "/mention_ids",
													schemaPath: "#/properties/mention_ids/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs34 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.mention_all !== void 0) {
											const _errs38 = errors;
											if (typeof data.mention_all !== "boolean") {
												validate145.errors = [{
													instancePath: instancePath + "/mention_all",
													schemaPath: "#/properties/mention_all/type",
													keyword: "type",
													params: { type: "boolean" },
													message: "must be boolean"
												}];
												return false;
											}
											var valid0 = _errs38 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate145.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate145.errors = vErrors;
	return errors === 0;
}
validate145.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateChatSendResponse = validate146;
var schema200 = {
	"type": "string",
	"enum": ["0.3"]
};
function validate148(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate148.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.message_id === void 0 && (missing0 = "message_id") || data.message_seq === void 0 && (missing0 = "message_seq") || data.event_seq === void 0 && (missing0 = "event_seq")) {
			validate148.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "message_id" || key0 === "message_seq" || key0 === "event_seq")) {
				validate148.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate148.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message_id !== void 0) {
					if (typeof data.message_id !== "string") {
						validate148.errors = [{
							instancePath: instancePath + "/message_id",
							schemaPath: "#/properties/message_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.message_seq !== void 0) {
						let data2 = data.message_seq;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate148.errors = [{
									instancePath: instancePath + "/message_seq",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate148.errors = [{
									instancePath: instancePath + "/message_seq",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate148.errors = [{
								instancePath: instancePath + "/message_seq",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.event_seq !== void 0) {
							let data3 = data.event_seq;
							if (typeof data3 === "string") {
								if (func2(data3) > 19) {
									validate148.errors = [{
										instancePath: instancePath + "/event_seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									}];
									return false;
								} else if (!pattern4.test(data3)) {
									validate148.errors = [{
										instancePath: instancePath + "/event_seq",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									}];
									return false;
								}
							} else {
								validate148.errors = [{
									instancePath: instancePath + "/event_seq",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
					}
				}
			}
		}
	} else {
		validate148.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate148.errors = vErrors;
	return true;
}
validate148.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate147(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate147.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate147.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate147.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate147.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate147.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema200.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate148(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate148.errors : vErrors.concat(validate148.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate147.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate147.errors = vErrors;
	return errors === 0;
}
validate147.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema206 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema207 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema208 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate152(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate152.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate152.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate152.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate152.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate152.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema207.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate152.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate152.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate152.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema208.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate152.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema206.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate152.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate152.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate152.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate152.errors = vErrors;
	return true;
}
validate152.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate151(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate151.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate151.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate151.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate151.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate151.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema200.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate152(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate152.errors : vErrors.concat(validate152.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate151.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate151.errors = vErrors;
	return errors === 0;
}
validate151.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate146(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate146.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate147(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate147.errors : vErrors.concat(validate147.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate151(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate151.errors : vErrors.concat(validate151.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate146.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate146.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate146.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateDevelopmentModelImportRequest = validate155;
function validate155(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate155.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id")) {
			validate155.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id")) {
				validate155.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate155.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
			}
		}
	} else {
		validate155.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate155.errors = vErrors;
	return true;
}
validate155.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateDevelopmentModelImportResponse = validate156;
var schema212 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema216 = {
	"type": "string",
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	]
};
var schema218 = {
	"type": "string",
	"enum": ["off", "enabled"]
};
function validate160(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate160.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate160.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "temperature" || key0 === "top_p" || key0 === "max_output_tokens" || key0 === "input_budget" || key0 === "reasoning")) {
				validate160.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.temperature !== void 0) {
				let data0 = data.temperature;
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 2 || isNaN(data0)) {
						validate160.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 2
							},
							message: "must be <= 2"
						}];
						return false;
					} else if (data0 < 0 || isNaN(data0)) {
						validate160.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: 0
							},
							message: "must be >= 0"
						}];
						return false;
					}
				} else {
					validate160.errors = [{
						instancePath: instancePath + "/temperature",
						schemaPath: "#/properties/temperature/type",
						keyword: "type",
						params: { type: "number" },
						message: "must be number"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.top_p !== void 0) {
					let data1 = data.top_p;
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 1 || isNaN(data1)) {
							validate160.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 1
								},
								message: "must be <= 1"
							}];
							return false;
						} else if (data1 < 0 || isNaN(data1)) {
							validate160.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/minimum",
								keyword: "minimum",
								params: {
									comparison: ">=",
									limit: 0
								},
								message: "must be >= 0"
							}];
							return false;
						}
					} else {
						validate160.errors = [{
							instancePath: instancePath + "/top_p",
							schemaPath: "#/properties/top_p/type",
							keyword: "type",
							params: { type: "number" },
							message: "must be number"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.max_output_tokens !== void 0) {
						let data2 = data.max_output_tokens;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate160.errors = [{
								instancePath: instancePath + "/max_output_tokens",
								schemaPath: "#/properties/max_output_tokens/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 32768 || isNaN(data2)) {
								validate160.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 32768
									},
									message: "must be <= 32768"
								}];
								return false;
							} else if (data2 < 1 || isNaN(data2)) {
								validate160.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 1
									},
									message: "must be >= 1"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.input_budget !== void 0) {
							let data3 = data.input_budget;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
								validate160.errors = [{
									instancePath: instancePath + "/input_budget",
									schemaPath: "#/properties/input_budget/type",
									keyword: "type",
									params: { type: "integer" },
									message: "must be integer"
								}];
								return false;
							}
							if (typeof data3 == "number" && isFinite(data3)) {
								if (data3 > 128e3 || isNaN(data3)) {
									validate160.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 128e3
										},
										message: "must be <= 128000"
									}];
									return false;
								} else if (data3 < 256 || isNaN(data3)) {
									validate160.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: 256
										},
										message: "must be >= 256"
									}];
									return false;
								}
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.reasoning !== void 0) {
								let data4 = data.reasoning;
								if (typeof data4 !== "string") {
									validate160.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "off" || data4 === "enabled")) {
									validate160.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/enum",
										keyword: "enum",
										params: { allowedValues: schema218.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate160.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate160.errors = vErrors;
	return true;
}
validate160.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate159(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate159.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters") || data.revision === void 0 && (missing0 = "revision") || data.credential_configured === void 0 && (missing0 = "credential_configured")) {
				validate159.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "protocol" || key0 === "base_url" || key0 === "model_name" || key0 === "parameters" || key0 === "revision" || key0 === "credential_configured")) {
					validate159.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.id !== void 0) {
						const _errs2 = errors;
						if (typeof data.id !== "string") {
							validate159.errors = [{
								instancePath: instancePath + "/id",
								schemaPath: "#/properties/id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.name !== void 0) {
							const _errs4 = errors;
							if (typeof data.name !== "string") {
								validate159.errors = [{
									instancePath: instancePath + "/name",
									schemaPath: "#/properties/name/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.protocol !== void 0) {
								let data2 = data.protocol;
								const _errs6 = errors;
								if (typeof data2 !== "string") {
									validate159.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data2 === "openai_chat_completions" || data2 === "anthropic_messages" || data2 === "openai_responses")) {
									validate159.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema216.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.base_url !== void 0) {
									const _errs9 = errors;
									if (typeof data.base_url !== "string") {
										validate159.errors = [{
											instancePath: instancePath + "/base_url",
											schemaPath: "#/properties/base_url/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.model_name !== void 0) {
										const _errs11 = errors;
										if (typeof data.model_name !== "string") {
											validate159.errors = [{
												instancePath: instancePath + "/model_name",
												schemaPath: "#/properties/model_name/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.parameters !== void 0) {
											const _errs13 = errors;
											if (!validate160(data.parameters, {
												instancePath: instancePath + "/parameters",
												parentData: data,
												parentDataProperty: "parameters",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate160.errors : vErrors.concat(validate160.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.revision !== void 0) {
												let data6 = data.revision;
												const _errs14 = errors;
												if (errors === errors) {
													if (typeof data6 === "string") {
														if (func2(data6) > 19) {
															validate159.errors = [{
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data6)) {
															validate159.errors = [{
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate159.errors = [{
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs14 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.credential_configured !== void 0) {
													const _errs17 = errors;
													if (typeof data.credential_configured !== "boolean") {
														validate159.errors = [{
															instancePath: instancePath + "/credential_configured",
															schemaPath: "#/properties/credential_configured/type",
															keyword: "type",
															params: { type: "boolean" },
															message: "must be boolean"
														}];
														return false;
													}
													var valid0 = _errs17 === errors;
												} else var valid0 = true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate159.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate159.errors = vErrors;
	return errors === 0;
}
validate159.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate163(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate163.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.language_style === void 0 && (missing0 = "language_style") || data.address_terms === void 0 && (missing0 = "address_terms") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.revision === void 0 && (missing0 = "revision")) {
			validate163.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "language_style" || key0 === "address_terms" || key0 === "skill" || key0 === "dimensions" || key0 === "revision")) {
				validate163.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.id !== void 0) {
				if (typeof data.id !== "string") {
					validate163.errors = [{
						instancePath: instancePath + "/id",
						schemaPath: "#/properties/id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.name !== void 0) {
					if (typeof data.name !== "string") {
						validate163.errors = [{
							instancePath: instancePath + "/name",
							schemaPath: "#/properties/name/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.language_style !== void 0) {
						if (typeof data.language_style !== "string") {
							validate163.errors = [{
								instancePath: instancePath + "/language_style",
								schemaPath: "#/properties/language_style/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.address_terms !== void 0) {
							let data3 = data.address_terms;
							if (Array.isArray(data3)) {
								const len0 = data3.length;
								for (let i0 = 0; i0 < len0; i0++) if (typeof data3[i0] !== "string") {
									validate163.errors = [{
										instancePath: instancePath + "/address_terms/" + i0,
										schemaPath: "#/properties/address_terms/items/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							} else {
								validate163.errors = [{
									instancePath: instancePath + "/address_terms",
									schemaPath: "#/properties/address_terms/type",
									keyword: "type",
									params: { type: "array" },
									message: "must be array"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.skill !== void 0) {
								if (typeof data.skill !== "string") {
									validate163.errors = [{
										instancePath: instancePath + "/skill",
										schemaPath: "#/properties/skill/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.dimensions !== void 0) {
									let data6 = data.dimensions;
									if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
										let missing1;
										if (data6.professional === void 0 && (missing1 = "professional") || data6.formal === void 0 && (missing1 = "formal") || data6.casual === void 0 && (missing1 = "casual") || data6.humor === void 0 && (missing1 = "humor") || data6.direct === void 0 && (missing1 = "direct") || data6.empathy === void 0 && (missing1 = "empathy") || data6.social_energy === void 0 && (missing1 = "social_energy")) {
											validate163.errors = [{
												instancePath: instancePath + "/dimensions",
												schemaPath: "#/$defs/PersonaDimensions/required",
												keyword: "required",
												params: { missingProperty: missing1 },
												message: "must have required property '" + missing1 + "'"
											}];
											return false;
										} else {
											for (const key1 in data6) if (!(key1 === "professional" || key1 === "formal" || key1 === "casual" || key1 === "humor" || key1 === "direct" || key1 === "empathy" || key1 === "social_energy")) {
												validate163.errors = [{
													instancePath: instancePath + "/dimensions",
													schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
													keyword: "additionalProperties",
													params: { additionalProperty: key1 },
													message: "must NOT have additional properties"
												}];
												return false;
											}
											if (data6.professional !== void 0) {
												let data7 = data6.professional;
												if (!(typeof data7 == "number" && !(data7 % 1) && !isNaN(data7) && isFinite(data7))) {
													validate163.errors = [{
														instancePath: instancePath + "/dimensions/professional",
														schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
														keyword: "type",
														params: { type: "integer" },
														message: "must be integer"
													}];
													return false;
												}
												if (typeof data7 == "number" && isFinite(data7)) {
													if (data7 > 100 || isNaN(data7)) {
														validate163.errors = [{
															instancePath: instancePath + "/dimensions/professional",
															schemaPath: "#/$defs/PersonaDimensions/properties/professional/maximum",
															keyword: "maximum",
															params: {
																comparison: "<=",
																limit: 100
															},
															message: "must be <= 100"
														}];
														return false;
													} else if (data7 < 0 || isNaN(data7)) {
														validate163.errors = [{
															instancePath: instancePath + "/dimensions/professional",
															schemaPath: "#/$defs/PersonaDimensions/properties/professional/minimum",
															keyword: "minimum",
															params: {
																comparison: ">=",
																limit: 0
															},
															message: "must be >= 0"
														}];
														return false;
													}
												}
												var valid3 = true;
											} else var valid3 = true;
											if (valid3) {
												if (data6.formal !== void 0) {
													let data8 = data6.formal;
													if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
														validate163.errors = [{
															instancePath: instancePath + "/dimensions/formal",
															schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
															keyword: "type",
															params: { type: "integer" },
															message: "must be integer"
														}];
														return false;
													}
													if (typeof data8 == "number" && isFinite(data8)) {
														if (data8 > 100 || isNaN(data8)) {
															validate163.errors = [{
																instancePath: instancePath + "/dimensions/formal",
																schemaPath: "#/$defs/PersonaDimensions/properties/formal/maximum",
																keyword: "maximum",
																params: {
																	comparison: "<=",
																	limit: 100
																},
																message: "must be <= 100"
															}];
															return false;
														} else if (data8 < 0 || isNaN(data8)) {
															validate163.errors = [{
																instancePath: instancePath + "/dimensions/formal",
																schemaPath: "#/$defs/PersonaDimensions/properties/formal/minimum",
																keyword: "minimum",
																params: {
																	comparison: ">=",
																	limit: 0
																},
																message: "must be >= 0"
															}];
															return false;
														}
													}
													var valid3 = true;
												} else var valid3 = true;
												if (valid3) {
													if (data6.casual !== void 0) {
														let data9 = data6.casual;
														if (!(typeof data9 == "number" && !(data9 % 1) && !isNaN(data9) && isFinite(data9))) {
															validate163.errors = [{
																instancePath: instancePath + "/dimensions/casual",
																schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (typeof data9 == "number" && isFinite(data9)) {
															if (data9 > 100 || isNaN(data9)) {
																validate163.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/maximum",
																	keyword: "maximum",
																	params: {
																		comparison: "<=",
																		limit: 100
																	},
																	message: "must be <= 100"
																}];
																return false;
															} else if (data9 < 0 || isNaN(data9)) {
																validate163.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/minimum",
																	keyword: "minimum",
																	params: {
																		comparison: ">=",
																		limit: 0
																	},
																	message: "must be >= 0"
																}];
																return false;
															}
														}
														var valid3 = true;
													} else var valid3 = true;
													if (valid3) {
														if (data6.humor !== void 0) {
															let data10 = data6.humor;
															if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																validate163.errors = [{
																	instancePath: instancePath + "/dimensions/humor",
																	schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																}];
																return false;
															}
															if (typeof data10 == "number" && isFinite(data10)) {
																if (data10 > 100 || isNaN(data10)) {
																	validate163.errors = [{
																		instancePath: instancePath + "/dimensions/humor",
																		schemaPath: "#/$defs/PersonaDimensions/properties/humor/maximum",
																		keyword: "maximum",
																		params: {
																			comparison: "<=",
																			limit: 100
																		},
																		message: "must be <= 100"
																	}];
																	return false;
																} else if (data10 < 0 || isNaN(data10)) {
																	validate163.errors = [{
																		instancePath: instancePath + "/dimensions/humor",
																		schemaPath: "#/$defs/PersonaDimensions/properties/humor/minimum",
																		keyword: "minimum",
																		params: {
																			comparison: ">=",
																			limit: 0
																		},
																		message: "must be >= 0"
																	}];
																	return false;
																}
															}
															var valid3 = true;
														} else var valid3 = true;
														if (valid3) {
															if (data6.direct !== void 0) {
																let data11 = data6.direct;
																if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																	validate163.errors = [{
																		instancePath: instancePath + "/dimensions/direct",
																		schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																		keyword: "type",
																		params: { type: "integer" },
																		message: "must be integer"
																	}];
																	return false;
																}
																if (typeof data11 == "number" && isFinite(data11)) {
																	if (data11 > 100 || isNaN(data11)) {
																		validate163.errors = [{
																			instancePath: instancePath + "/dimensions/direct",
																			schemaPath: "#/$defs/PersonaDimensions/properties/direct/maximum",
																			keyword: "maximum",
																			params: {
																				comparison: "<=",
																				limit: 100
																			},
																			message: "must be <= 100"
																		}];
																		return false;
																	} else if (data11 < 0 || isNaN(data11)) {
																		validate163.errors = [{
																			instancePath: instancePath + "/dimensions/direct",
																			schemaPath: "#/$defs/PersonaDimensions/properties/direct/minimum",
																			keyword: "minimum",
																			params: {
																				comparison: ">=",
																				limit: 0
																			},
																			message: "must be >= 0"
																		}];
																		return false;
																	}
																}
																var valid3 = true;
															} else var valid3 = true;
															if (valid3) {
																if (data6.empathy !== void 0) {
																	let data12 = data6.empathy;
																	if (!(typeof data12 == "number" && !(data12 % 1) && !isNaN(data12) && isFinite(data12))) {
																		validate163.errors = [{
																			instancePath: instancePath + "/dimensions/empathy",
																			schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																			keyword: "type",
																			params: { type: "integer" },
																			message: "must be integer"
																		}];
																		return false;
																	}
																	if (typeof data12 == "number" && isFinite(data12)) {
																		if (data12 > 100 || isNaN(data12)) {
																			validate163.errors = [{
																				instancePath: instancePath + "/dimensions/empathy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/empathy/maximum",
																				keyword: "maximum",
																				params: {
																					comparison: "<=",
																					limit: 100
																				},
																				message: "must be <= 100"
																			}];
																			return false;
																		} else if (data12 < 0 || isNaN(data12)) {
																			validate163.errors = [{
																				instancePath: instancePath + "/dimensions/empathy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/empathy/minimum",
																				keyword: "minimum",
																				params: {
																					comparison: ">=",
																					limit: 0
																				},
																				message: "must be >= 0"
																			}];
																			return false;
																		}
																	}
																	var valid3 = true;
																} else var valid3 = true;
																if (valid3) {
																	if (data6.social_energy !== void 0) {
																		let data13 = data6.social_energy;
																		if (!(typeof data13 == "number" && !(data13 % 1) && !isNaN(data13) && isFinite(data13))) {
																			validate163.errors = [{
																				instancePath: instancePath + "/dimensions/social_energy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																				keyword: "type",
																				params: { type: "integer" },
																				message: "must be integer"
																			}];
																			return false;
																		}
																		if (typeof data13 == "number" && isFinite(data13)) {
																			if (data13 > 100 || isNaN(data13)) {
																				validate163.errors = [{
																					instancePath: instancePath + "/dimensions/social_energy",
																					schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/maximum",
																					keyword: "maximum",
																					params: {
																						comparison: "<=",
																						limit: 100
																					},
																					message: "must be <= 100"
																				}];
																				return false;
																			} else if (data13 < 0 || isNaN(data13)) {
																				validate163.errors = [{
																					instancePath: instancePath + "/dimensions/social_energy",
																					schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/minimum",
																					keyword: "minimum",
																					params: {
																						comparison: ">=",
																						limit: 0
																					},
																					message: "must be >= 0"
																				}];
																				return false;
																			}
																		}
																		var valid3 = true;
																	} else var valid3 = true;
																}
															}
														}
													}
												}
											}
										}
									} else {
										validate163.errors = [{
											instancePath: instancePath + "/dimensions",
											schemaPath: "#/$defs/PersonaDimensions/type",
											keyword: "type",
											params: { type: "object" },
											message: "must be object"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.revision !== void 0) {
										let data14 = data.revision;
										if (typeof data14 === "string") {
											if (func2(data14) > 19) {
												validate163.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												}];
												return false;
											} else if (!pattern4.test(data14)) {
												validate163.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												}];
												return false;
											}
										} else {
											validate163.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = true;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate163.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate163.errors = vErrors;
	return true;
}
validate163.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate158(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate158.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.revision === void 0 && (missing0 = "revision") || data.model_profiles === void 0 && (missing0 = "model_profiles") || data.persona_presets === void 0 && (missing0 = "persona_presets") || data.runtime_defaults === void 0 && (missing0 = "runtime_defaults")) {
				validate158.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "revision" || key0 === "model_profiles" || key0 === "persona_presets" || key0 === "runtime_defaults")) {
					validate158.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.revision !== void 0) {
						let data0 = data.revision;
						const _errs2 = errors;
						if (errors === errors) {
							if (typeof data0 === "string") {
								if (func2(data0) > 19) {
									validate158.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									}];
									return false;
								} else if (!pattern4.test(data0)) {
									validate158.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									}];
									return false;
								}
							} else {
								validate158.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.model_profiles !== void 0) {
							let data1 = data.model_profiles;
							const _errs5 = errors;
							if (errors === _errs5) {
								if (Array.isArray(data1)) {
									const len0 = data1.length;
									for (let i0 = 0; i0 < len0; i0++) {
										const _errs7 = errors;
										if (!validate159(data1[i0], {
											instancePath: instancePath + "/model_profiles/" + i0,
											parentData: data1,
											parentDataProperty: i0,
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate159.errors : vErrors.concat(validate159.errors);
											errors = vErrors.length;
										}
										if (!(_errs7 === errors)) break;
									}
								} else {
									validate158.errors = [{
										instancePath: instancePath + "/model_profiles",
										schemaPath: "#/properties/model_profiles/type",
										keyword: "type",
										params: { type: "array" },
										message: "must be array"
									}];
									return false;
								}
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.persona_presets !== void 0) {
								let data3 = data.persona_presets;
								const _errs8 = errors;
								if (errors === _errs8) {
									if (Array.isArray(data3)) {
										const len1 = data3.length;
										for (let i1 = 0; i1 < len1; i1++) {
											const _errs10 = errors;
											if (!validate163(data3[i1], {
												instancePath: instancePath + "/persona_presets/" + i1,
												parentData: data3,
												parentDataProperty: i1,
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate163.errors : vErrors.concat(validate163.errors);
												errors = vErrors.length;
											}
											if (!(_errs10 === errors)) break;
										}
									} else {
										validate158.errors = [{
											instancePath: instancePath + "/persona_presets",
											schemaPath: "#/properties/persona_presets/type",
											keyword: "type",
											params: { type: "array" },
											message: "must be array"
										}];
										return false;
									}
								}
								var valid0 = _errs8 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.runtime_defaults !== void 0) {
									let data5 = data.runtime_defaults;
									const _errs11 = errors;
									if (errors === errors) {
										if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
											let missing1;
											if (data5.request_limit_daily === void 0 && (missing1 = "request_limit_daily") || data5.persistent_memory === void 0 && (missing1 = "persistent_memory") || data5.allow_autonomous_wake === void 0 && (missing1 = "allow_autonomous_wake")) {
												validate158.errors = [{
													instancePath: instancePath + "/runtime_defaults",
													schemaPath: "#/$defs/AgentPreferences/required",
													keyword: "required",
													params: { missingProperty: missing1 },
													message: "must have required property '" + missing1 + "'"
												}];
												return false;
											} else {
												const _errs14 = errors;
												for (const key1 in data5) if (!(key1 === "request_limit_daily" || key1 === "persistent_memory" || key1 === "allow_autonomous_wake")) {
													validate158.errors = [{
														instancePath: instancePath + "/runtime_defaults",
														schemaPath: "#/$defs/AgentPreferences/additionalProperties",
														keyword: "additionalProperties",
														params: { additionalProperty: key1 },
														message: "must NOT have additional properties"
													}];
													return false;
												}
												if (_errs14 === errors) {
													if (data5.request_limit_daily !== void 0) {
														let data6 = data5.request_limit_daily;
														const _errs15 = errors;
														if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
															validate158.errors = [{
																instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (errors === _errs15) {
															if (typeof data6 == "number" && isFinite(data6)) {
																if (data6 > 5e3 || isNaN(data6)) {
																	validate158.errors = [{
																		instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																		schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/maximum",
																		keyword: "maximum",
																		params: {
																			comparison: "<=",
																			limit: 5e3
																		},
																		message: "must be <= 5000"
																	}];
																	return false;
																} else if (data6 < 1 || isNaN(data6)) {
																	validate158.errors = [{
																		instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																		schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/minimum",
																		keyword: "minimum",
																		params: {
																			comparison: ">=",
																			limit: 1
																		},
																		message: "must be >= 1"
																	}];
																	return false;
																}
															}
														}
														var valid5 = _errs15 === errors;
													} else var valid5 = true;
													if (valid5) {
														if (data5.persistent_memory !== void 0) {
															const _errs17 = errors;
															if (typeof data5.persistent_memory !== "boolean") {
																validate158.errors = [{
																	instancePath: instancePath + "/runtime_defaults/persistent_memory",
																	schemaPath: "#/$defs/AgentPreferences/properties/persistent_memory/type",
																	keyword: "type",
																	params: { type: "boolean" },
																	message: "must be boolean"
																}];
																return false;
															}
															var valid5 = _errs17 === errors;
														} else var valid5 = true;
														if (valid5) {
															if (data5.allow_autonomous_wake !== void 0) {
																const _errs19 = errors;
																if (typeof data5.allow_autonomous_wake !== "boolean") {
																	validate158.errors = [{
																		instancePath: instancePath + "/runtime_defaults/allow_autonomous_wake",
																		schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																		keyword: "type",
																		params: { type: "boolean" },
																		message: "must be boolean"
																	}];
																	return false;
																}
																var valid5 = _errs19 === errors;
															} else var valid5 = true;
														}
													}
												}
											}
										} else {
											validate158.errors = [{
												instancePath: instancePath + "/runtime_defaults",
												schemaPath: "#/$defs/AgentPreferences/type",
												keyword: "type",
												params: { type: "object" },
												message: "must be object"
											}];
											return false;
										}
									}
									var valid0 = _errs11 === errors;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		} else {
			validate158.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate158.errors = vErrors;
	return errors === 0;
}
validate158.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate157(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate157.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate157.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate157.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate157.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate157.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema212.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate158(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate158.errors : vErrors.concat(validate158.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate157.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate157.errors = vErrors;
	return errors === 0;
}
validate157.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema226 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema227 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema228 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate168(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate168.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate168.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate168.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate168.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate168.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema227.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate168.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate168.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate168.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema228.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate168.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema226.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate168.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate168.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate168.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate168.errors = vErrors;
	return true;
}
validate168.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate167(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate167.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate167.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate167.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate167.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate167.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema212.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate168(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate168.errors : vErrors.concat(validate168.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate167.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate167.errors = vErrors;
	return errors === 0;
}
validate167.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate156(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate156.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate157(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate157.errors : vErrors.concat(validate157.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate167(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate167.errors : vErrors.concat(validate167.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate156.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate156.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate156.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateDomainEvent = validate171;
var schema230 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema235 = {
	"type": "string",
	"enum": [
		"system",
		"light",
		"dark"
	]
};
function validate173(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate173.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion") || data.revision === void 0 && (missing0 = "revision")) {
			validate173.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "theme" || key0 === "reduce_motion" || key0 === "revision")) {
				validate173.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.theme !== void 0) {
				let data0 = data.theme;
				if (typeof data0 !== "string") {
					validate173.errors = [{
						instancePath: instancePath + "/theme",
						schemaPath: "#/$defs/Theme/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "system" || data0 === "light" || data0 === "dark")) {
					validate173.errors = [{
						instancePath: instancePath + "/theme",
						schemaPath: "#/$defs/Theme/enum",
						keyword: "enum",
						params: { allowedValues: schema235.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.reduce_motion !== void 0) {
					if (typeof data.reduce_motion !== "boolean") {
						validate173.errors = [{
							instancePath: instancePath + "/reduce_motion",
							schemaPath: "#/properties/reduce_motion/type",
							keyword: "type",
							params: { type: "boolean" },
							message: "must be boolean"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.revision !== void 0) {
						let data2 = data.revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate173.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate173.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate173.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate173.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate173.errors = vErrors;
	return true;
}
validate173.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema237 = {
	"type": "object",
	"properties": {
		"id": { "type": "string" },
		"kind": { "$ref": "#/$defs/ParticipantKind" },
		"display_name": { "type": "string" },
		"introduction": { "type": "string" },
		"status": { "$ref": "#/$defs/ParticipantStatus" },
		"is_builtin": { "type": "boolean" },
		"avatar_id": {
			"type": ["string", "null"],
			"default": null
		},
		"profile_revision": {
			"$ref": "#/$defs/DecimalString",
			"default": "1"
		}
	},
	"additionalProperties": false,
	"required": [
		"id",
		"kind",
		"display_name",
		"introduction",
		"status",
		"is_builtin",
		"avatar_id",
		"profile_revision"
	]
};
var schema238 = {
	"type": "string",
	"enum": ["user", "agent"]
};
var schema239 = {
	"type": "string",
	"enum": ["present", "needs_configuration"]
};
function validate175(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate175.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.kind === void 0 && (missing0 = "kind") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.status === void 0 && (missing0 = "status") || data.is_builtin === void 0 && (missing0 = "is_builtin") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.profile_revision === void 0 && (missing0 = "profile_revision")) {
			validate175.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "id" || key0 === "kind" || key0 === "display_name" || key0 === "introduction" || key0 === "status" || key0 === "is_builtin" || key0 === "avatar_id" || key0 === "profile_revision")) {
				validate175.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.id !== void 0) {
				if (typeof data.id !== "string") {
					validate175.errors = [{
						instancePath: instancePath + "/id",
						schemaPath: "#/properties/id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.kind !== void 0) {
					let data1 = data.kind;
					if (typeof data1 !== "string") {
						validate175.errors = [{
							instancePath: instancePath + "/kind",
							schemaPath: "#/$defs/ParticipantKind/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data1 === "user" || data1 === "agent")) {
						validate175.errors = [{
							instancePath: instancePath + "/kind",
							schemaPath: "#/$defs/ParticipantKind/enum",
							keyword: "enum",
							params: { allowedValues: schema238.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.display_name !== void 0) {
						if (typeof data.display_name !== "string") {
							validate175.errors = [{
								instancePath: instancePath + "/display_name",
								schemaPath: "#/properties/display_name/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.introduction !== void 0) {
							if (typeof data.introduction !== "string") {
								validate175.errors = [{
									instancePath: instancePath + "/introduction",
									schemaPath: "#/properties/introduction/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.status !== void 0) {
								let data4 = data.status;
								if (typeof data4 !== "string") {
									validate175.errors = [{
										instancePath: instancePath + "/status",
										schemaPath: "#/$defs/ParticipantStatus/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "present" || data4 === "needs_configuration")) {
									validate175.errors = [{
										instancePath: instancePath + "/status",
										schemaPath: "#/$defs/ParticipantStatus/enum",
										keyword: "enum",
										params: { allowedValues: schema239.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.is_builtin !== void 0) {
									if (typeof data.is_builtin !== "boolean") {
										validate175.errors = [{
											instancePath: instancePath + "/is_builtin",
											schemaPath: "#/properties/is_builtin/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.avatar_id !== void 0) {
										let data6 = data.avatar_id;
										if (typeof data6 !== "string" && data6 !== null) {
											validate175.errors = [{
												instancePath: instancePath + "/avatar_id",
												schemaPath: "#/properties/avatar_id/type",
												keyword: "type",
												params: { type: schema237.properties.avatar_id.type },
												message: "must be string,null"
											}];
											return false;
										}
										var valid0 = true;
									} else var valid0 = true;
									if (valid0) {
										if (data.profile_revision !== void 0) {
											let data7 = data.profile_revision;
											if (typeof data7 === "string") {
												if (func2(data7) > 19) {
													validate175.errors = [{
														instancePath: instancePath + "/profile_revision",
														schemaPath: "#/$defs/DecimalString/maxLength",
														keyword: "maxLength",
														params: { limit: 19 },
														message: "must NOT have more than 19 characters"
													}];
													return false;
												} else if (!pattern4.test(data7)) {
													validate175.errors = [{
														instancePath: instancePath + "/profile_revision",
														schemaPath: "#/$defs/DecimalString/pattern",
														keyword: "pattern",
														params: { pattern: "^(0|[1-9][0-9]*)$" },
														message: "must match pattern \"^(0|[1-9][0-9]*)$\""
													}];
													return false;
												}
											} else {
												validate175.errors = [{
													instancePath: instancePath + "/profile_revision",
													schemaPath: "#/$defs/DecimalString/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											var valid0 = true;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate175.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate175.errors = vErrors;
	return true;
}
validate175.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate172(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate172.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	let passing0 = null;
	const _errs1 = errors;
	if (errors === _errs1) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.kind === void 0 && (missing0 = "kind") || data.message_id === void 0 && (missing0 = "message_id") || data.message_seq === void 0 && (missing0 = "message_seq") || data.sender_id === void 0 && (missing0 = "sender_id")) {
				const err0 = {
					instancePath,
					schemaPath: "#/oneOf/0/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				};
				if (vErrors === null) vErrors = [err0];
				else vErrors.push(err0);
				errors++;
			} else {
				const _errs3 = errors;
				for (const key0 in data) if (!(key0 === "kind" || key0 === "message_id" || key0 === "message_seq" || key0 === "sender_id")) {
					const err1 = {
						instancePath,
						schemaPath: "#/oneOf/0/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err1];
					else vErrors.push(err1);
					errors++;
					break;
				}
				if (_errs3 === errors) {
					if (data.kind !== void 0) {
						let data0 = data.kind;
						const _errs4 = errors;
						if (typeof data0 !== "string") {
							const err2 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err2];
							else vErrors.push(err2);
							errors++;
						}
						if ("message_committed" !== data0) {
							const err3 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "message_committed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var valid1 = _errs4 === errors;
					} else var valid1 = true;
					if (valid1) {
						if (data.message_id !== void 0) {
							const _errs6 = errors;
							if (typeof data.message_id !== "string") {
								const err4 = {
									instancePath: instancePath + "/message_id",
									schemaPath: "#/oneOf/0/properties/message_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
							}
							var valid1 = _errs6 === errors;
						} else var valid1 = true;
						if (valid1) {
							if (data.message_seq !== void 0) {
								let data2 = data.message_seq;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											const err5 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err5];
											else vErrors.push(err5);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err6 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err6];
											else vErrors.push(err6);
											errors++;
										}
									} else {
										const err7 = {
											instancePath: instancePath + "/message_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err7];
										else vErrors.push(err7);
										errors++;
									}
								}
								var valid1 = _errs8 === errors;
							} else var valid1 = true;
							if (valid1) {
								if (data.sender_id !== void 0) {
									const _errs11 = errors;
									if (typeof data.sender_id !== "string") {
										const err8 = {
											instancePath: instancePath + "/sender_id",
											schemaPath: "#/oneOf/0/properties/sender_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err8];
										else vErrors.push(err8);
										errors++;
									}
									var valid1 = _errs11 === errors;
								} else var valid1 = true;
							}
						}
					}
				}
			}
		} else {
			const err9 = {
				instancePath,
				schemaPath: "#/oneOf/0/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err9];
			else vErrors.push(err9);
			errors++;
		}
	}
	var _valid0 = _errs1 === errors;
	if (_valid0) {
		valid0 = true;
		passing0 = 0;
		var props0 = true;
	}
	const _errs13 = errors;
	if (errors === _errs13) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing1;
			if (data.kind === void 0 && (missing1 = "kind") || data.appearance === void 0 && (missing1 = "appearance")) {
				const err10 = {
					instancePath,
					schemaPath: "#/oneOf/1/required",
					keyword: "required",
					params: { missingProperty: missing1 },
					message: "must have required property '" + missing1 + "'"
				};
				if (vErrors === null) vErrors = [err10];
				else vErrors.push(err10);
				errors++;
			} else {
				const _errs15 = errors;
				for (const key1 in data) if (!(key1 === "kind" || key1 === "appearance")) {
					const err11 = {
						instancePath,
						schemaPath: "#/oneOf/1/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key1 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err11];
					else vErrors.push(err11);
					errors++;
					break;
				}
				if (_errs15 === errors) {
					if (data.kind !== void 0) {
						let data4 = data.kind;
						const _errs16 = errors;
						if (typeof data4 !== "string") {
							const err12 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/1/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err12];
							else vErrors.push(err12);
							errors++;
						}
						if ("appearance_changed" !== data4) {
							const err13 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/1/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "appearance_changed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err13];
							else vErrors.push(err13);
							errors++;
						}
						var valid3 = _errs16 === errors;
					} else var valid3 = true;
					if (valid3) {
						if (data.appearance !== void 0) {
							const _errs18 = errors;
							if (!validate173(data.appearance, {
								instancePath: instancePath + "/appearance",
								parentData: data,
								parentDataProperty: "appearance",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate173.errors : vErrors.concat(validate173.errors);
								errors = vErrors.length;
							}
							var valid3 = _errs18 === errors;
						} else var valid3 = true;
					}
				}
			}
		} else {
			const err14 = {
				instancePath,
				schemaPath: "#/oneOf/1/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err14];
			else vErrors.push(err14);
			errors++;
		}
	}
	var _valid0 = _errs13 === errors;
	if (_valid0 && valid0) {
		valid0 = false;
		passing0 = [passing0, 1];
	} else {
		if (_valid0) {
			valid0 = true;
			passing0 = 1;
			if (props0 !== true) props0 = true;
		}
		const _errs19 = errors;
		if (errors === _errs19) {
			if (data && typeof data == "object" && !Array.isArray(data)) {
				let missing2;
				if (data.kind === void 0 && (missing2 = "kind") || data.participant === void 0 && (missing2 = "participant")) {
					const err15 = {
						instancePath,
						schemaPath: "#/oneOf/2/required",
						keyword: "required",
						params: { missingProperty: missing2 },
						message: "must have required property '" + missing2 + "'"
					};
					if (vErrors === null) vErrors = [err15];
					else vErrors.push(err15);
					errors++;
				} else {
					const _errs21 = errors;
					for (const key2 in data) if (!(key2 === "kind" || key2 === "participant")) {
						const err16 = {
							instancePath,
							schemaPath: "#/oneOf/2/additionalProperties",
							keyword: "additionalProperties",
							params: { additionalProperty: key2 },
							message: "must NOT have additional properties"
						};
						if (vErrors === null) vErrors = [err16];
						else vErrors.push(err16);
						errors++;
						break;
					}
					if (_errs21 === errors) {
						if (data.kind !== void 0) {
							let data6 = data.kind;
							const _errs22 = errors;
							if (typeof data6 !== "string") {
								const err17 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/2/properties/kind/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err17];
								else vErrors.push(err17);
								errors++;
							}
							if ("participant_profile_changed" !== data6) {
								const err18 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/2/properties/kind/const",
									keyword: "const",
									params: { allowedValue: "participant_profile_changed" },
									message: "must be equal to constant"
								};
								if (vErrors === null) vErrors = [err18];
								else vErrors.push(err18);
								errors++;
							}
							var valid4 = _errs22 === errors;
						} else var valid4 = true;
						if (valid4) {
							if (data.participant !== void 0) {
								const _errs24 = errors;
								if (!validate175(data.participant, {
									instancePath: instancePath + "/participant",
									parentData: data,
									parentDataProperty: "participant",
									rootData,
									dynamicAnchors
								})) {
									vErrors = vErrors === null ? validate175.errors : vErrors.concat(validate175.errors);
									errors = vErrors.length;
								}
								var valid4 = _errs24 === errors;
							} else var valid4 = true;
						}
					}
				}
			} else {
				const err19 = {
					instancePath,
					schemaPath: "#/oneOf/2/type",
					keyword: "type",
					params: { type: "object" },
					message: "must be object"
				};
				if (vErrors === null) vErrors = [err19];
				else vErrors.push(err19);
				errors++;
			}
		}
		var _valid0 = _errs19 === errors;
		if (_valid0 && valid0) {
			valid0 = false;
			passing0 = [passing0, 2];
		} else {
			if (_valid0) {
				valid0 = true;
				passing0 = 2;
				if (props0 !== true) props0 = true;
			}
			const _errs25 = errors;
			if (errors === _errs25) {
				if (data && typeof data == "object" && !Array.isArray(data)) {
					let missing3;
					if (data.kind === void 0 && (missing3 = "kind") || data.agent_id === void 0 && (missing3 = "agent_id") || data.revision === void 0 && (missing3 = "revision")) {
						const err20 = {
							instancePath,
							schemaPath: "#/oneOf/3/required",
							keyword: "required",
							params: { missingProperty: missing3 },
							message: "must have required property '" + missing3 + "'"
						};
						if (vErrors === null) vErrors = [err20];
						else vErrors.push(err20);
						errors++;
					} else {
						const _errs27 = errors;
						for (const key3 in data) if (!(key3 === "kind" || key3 === "agent_id" || key3 === "revision")) {
							const err21 = {
								instancePath,
								schemaPath: "#/oneOf/3/additionalProperties",
								keyword: "additionalProperties",
								params: { additionalProperty: key3 },
								message: "must NOT have additional properties"
							};
							if (vErrors === null) vErrors = [err21];
							else vErrors.push(err21);
							errors++;
							break;
						}
						if (_errs27 === errors) {
							if (data.kind !== void 0) {
								let data8 = data.kind;
								const _errs28 = errors;
								if (typeof data8 !== "string") {
									const err22 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/3/properties/kind/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err22];
									else vErrors.push(err22);
									errors++;
								}
								if ("agent_configuration_changed" !== data8) {
									const err23 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/3/properties/kind/const",
										keyword: "const",
										params: { allowedValue: "agent_configuration_changed" },
										message: "must be equal to constant"
									};
									if (vErrors === null) vErrors = [err23];
									else vErrors.push(err23);
									errors++;
								}
								var valid5 = _errs28 === errors;
							} else var valid5 = true;
							if (valid5) {
								if (data.agent_id !== void 0) {
									const _errs30 = errors;
									if (typeof data.agent_id !== "string") {
										const err24 = {
											instancePath: instancePath + "/agent_id",
											schemaPath: "#/oneOf/3/properties/agent_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err24];
										else vErrors.push(err24);
										errors++;
									}
									var valid5 = _errs30 === errors;
								} else var valid5 = true;
								if (valid5) {
									if (data.revision !== void 0) {
										let data10 = data.revision;
										const _errs32 = errors;
										if (errors === errors) {
											if (typeof data10 === "string") {
												if (func2(data10) > 19) {
													const err25 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/maxLength",
														keyword: "maxLength",
														params: { limit: 19 },
														message: "must NOT have more than 19 characters"
													};
													if (vErrors === null) vErrors = [err25];
													else vErrors.push(err25);
													errors++;
												} else if (!pattern4.test(data10)) {
													const err26 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/pattern",
														keyword: "pattern",
														params: { pattern: "^(0|[1-9][0-9]*)$" },
														message: "must match pattern \"^(0|[1-9][0-9]*)$\""
													};
													if (vErrors === null) vErrors = [err26];
													else vErrors.push(err26);
													errors++;
												}
											} else {
												const err27 = {
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												};
												if (vErrors === null) vErrors = [err27];
												else vErrors.push(err27);
												errors++;
											}
										}
										var valid5 = _errs32 === errors;
									} else var valid5 = true;
								}
							}
						}
					}
				} else {
					const err28 = {
						instancePath,
						schemaPath: "#/oneOf/3/type",
						keyword: "type",
						params: { type: "object" },
						message: "must be object"
					};
					if (vErrors === null) vErrors = [err28];
					else vErrors.push(err28);
					errors++;
				}
			}
			var _valid0 = _errs25 === errors;
			if (_valid0 && valid0) {
				valid0 = false;
				passing0 = [passing0, 3];
			} else {
				if (_valid0) {
					valid0 = true;
					passing0 = 3;
					if (props0 !== true) props0 = true;
				}
				const _errs35 = errors;
				if (errors === _errs35) {
					if (data && typeof data == "object" && !Array.isArray(data)) {
						let missing4;
						if (data.kind === void 0 && (missing4 = "kind") || data.revision === void 0 && (missing4 = "revision")) {
							const err29 = {
								instancePath,
								schemaPath: "#/oneOf/4/required",
								keyword: "required",
								params: { missingProperty: missing4 },
								message: "must have required property '" + missing4 + "'"
							};
							if (vErrors === null) vErrors = [err29];
							else vErrors.push(err29);
							errors++;
						} else {
							const _errs37 = errors;
							for (const key4 in data) if (!(key4 === "kind" || key4 === "revision")) {
								const err30 = {
									instancePath,
									schemaPath: "#/oneOf/4/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key4 },
									message: "must NOT have additional properties"
								};
								if (vErrors === null) vErrors = [err30];
								else vErrors.push(err30);
								errors++;
								break;
							}
							if (_errs37 === errors) {
								if (data.kind !== void 0) {
									let data11 = data.kind;
									const _errs38 = errors;
									if (typeof data11 !== "string") {
										const err31 = {
											instancePath: instancePath + "/kind",
											schemaPath: "#/oneOf/4/properties/kind/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err31];
										else vErrors.push(err31);
										errors++;
									}
									if ("global_configuration_changed" !== data11) {
										const err32 = {
											instancePath: instancePath + "/kind",
											schemaPath: "#/oneOf/4/properties/kind/const",
											keyword: "const",
											params: { allowedValue: "global_configuration_changed" },
											message: "must be equal to constant"
										};
										if (vErrors === null) vErrors = [err32];
										else vErrors.push(err32);
										errors++;
									}
									var valid7 = _errs38 === errors;
								} else var valid7 = true;
								if (valid7) {
									if (data.revision !== void 0) {
										let data12 = data.revision;
										const _errs40 = errors;
										if (errors === errors) {
											if (typeof data12 === "string") {
												if (func2(data12) > 19) {
													const err33 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/maxLength",
														keyword: "maxLength",
														params: { limit: 19 },
														message: "must NOT have more than 19 characters"
													};
													if (vErrors === null) vErrors = [err33];
													else vErrors.push(err33);
													errors++;
												} else if (!pattern4.test(data12)) {
													const err34 = {
														instancePath: instancePath + "/revision",
														schemaPath: "#/$defs/DecimalString/pattern",
														keyword: "pattern",
														params: { pattern: "^(0|[1-9][0-9]*)$" },
														message: "must match pattern \"^(0|[1-9][0-9]*)$\""
													};
													if (vErrors === null) vErrors = [err34];
													else vErrors.push(err34);
													errors++;
												}
											} else {
												const err35 = {
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												};
												if (vErrors === null) vErrors = [err35];
												else vErrors.push(err35);
												errors++;
											}
										}
										var valid7 = _errs40 === errors;
									} else var valid7 = true;
								}
							}
						}
					} else {
						const err36 = {
							instancePath,
							schemaPath: "#/oneOf/4/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						};
						if (vErrors === null) vErrors = [err36];
						else vErrors.push(err36);
						errors++;
					}
				}
				var _valid0 = _errs35 === errors;
				if (_valid0 && valid0) {
					valid0 = false;
					passing0 = [passing0, 4];
				} else if (_valid0) {
					valid0 = true;
					passing0 = 4;
					if (props0 !== true) props0 = true;
				}
			}
		}
	}
	if (!valid0) {
		const err37 = {
			instancePath,
			schemaPath: "#/oneOf",
			keyword: "oneOf",
			params: { passingSchemas: passing0 },
			message: "must match exactly one schema in oneOf"
		};
		if (vErrors === null) vErrors = [err37];
		else vErrors.push(err37);
		errors++;
		validate172.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate172.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate172.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
function validate171(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate171.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.event_seq === void 0 && (missing0 = "event_seq") || data.event_id === void 0 && (missing0 = "event_id") || data.occurred_at === void 0 && (missing0 = "occurred_at") || data.payload === void 0 && (missing0 = "payload")) {
				validate171.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data_generation_id" || key0 === "event_seq" || key0 === "event_id" || key0 === "occurred_at" || key0 === "payload")) {
					validate171.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate171.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate171.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema230.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data_generation_id !== void 0) {
							const _errs5 = errors;
							if (typeof data.data_generation_id !== "string") {
								validate171.errors = [{
									instancePath: instancePath + "/data_generation_id",
									schemaPath: "#/properties/data_generation_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.event_seq !== void 0) {
								let data2 = data.event_seq;
								const _errs7 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											validate171.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate171.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate171.errors = [{
											instancePath: instancePath + "/event_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.event_id !== void 0) {
									const _errs10 = errors;
									if (typeof data.event_id !== "string") {
										validate171.errors = [{
											instancePath: instancePath + "/event_id",
											schemaPath: "#/properties/event_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs10 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.occurred_at !== void 0) {
										let data4 = data.occurred_at;
										const _errs12 = errors;
										if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
											validate171.errors = [{
												instancePath: instancePath + "/occurred_at",
												schemaPath: "#/properties/occurred_at/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (errors === _errs12) {
											if (typeof data4 == "number" && isFinite(data4)) {
												if (data4 > 9007199254740991 || isNaN(data4)) {
													validate171.errors = [{
														instancePath: instancePath + "/occurred_at",
														schemaPath: "#/properties/occurred_at/maximum",
														keyword: "maximum",
														params: {
															comparison: "<=",
															limit: 9007199254740991
														},
														message: "must be <= 9007199254740991"
													}];
													return false;
												} else if (data4 < -9007199254740991 || isNaN(data4)) {
													validate171.errors = [{
														instancePath: instancePath + "/occurred_at",
														schemaPath: "#/properties/occurred_at/minimum",
														keyword: "minimum",
														params: {
															comparison: ">=",
															limit: -9007199254740991
														},
														message: "must be >= -9007199254740991"
													}];
													return false;
												}
											}
										}
										var valid0 = _errs12 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.payload !== void 0) {
											const _errs14 = errors;
											if (!validate172(data.payload, {
												instancePath: instancePath + "/payload",
												parentData: data,
												parentDataProperty: "payload",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate172.errors : vErrors.concat(validate172.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs14 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate171.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate171.errors = vErrors;
	return errors === 0;
}
validate171.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateExitRequest = validate178;
var schema243 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"title": "ExitRequest",
	"type": "object",
	"properties": { "data_generation_id": {
		"type": ["string", "null"],
		"default": null
	} },
	"additionalProperties": false
};
function validate178(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate178.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		for (const key0 in data) if (!(key0 === "data_generation_id")) {
			validate178.errors = [{
				instancePath,
				schemaPath: "#/additionalProperties",
				keyword: "additionalProperties",
				params: { additionalProperty: key0 },
				message: "must NOT have additional properties"
			}];
			return false;
		}
		if (data.data_generation_id !== void 0) {
			let data0 = data.data_generation_id;
			if (typeof data0 !== "string" && data0 !== null) {
				validate178.errors = [{
					instancePath: instancePath + "/data_generation_id",
					schemaPath: "#/properties/data_generation_id/type",
					keyword: "type",
					params: { type: schema243.properties.data_generation_id.type },
					message: "must be string,null"
				}];
				return false;
			}
		}
	} else {
		validate178.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate178.errors = vErrors;
	return true;
}
validate178.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateExitResponse = validate179;
var schema246 = {
	"type": "string",
	"enum": ["0.3"]
};
function validate180(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate180.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate180.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
				validate180.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.schema_version !== void 0) {
				let data0 = data.schema_version;
				if (typeof data0 !== "string") {
					validate180.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "0.3")) {
					validate180.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/enum",
						keyword: "enum",
						params: { allowedValues: schema246.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data !== void 0) {
					let data1 = data.data;
					if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
						let missing1;
						if (data1.shutting_down === void 0 && (missing1 = "shutting_down")) {
							validate180.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/ExitResult/required",
								keyword: "required",
								params: { missingProperty: missing1 },
								message: "must have required property '" + missing1 + "'"
							}];
							return false;
						} else {
							for (const key1 in data1) if (!(key1 === "shutting_down")) {
								validate180.errors = [{
									instancePath: instancePath + "/data",
									schemaPath: "#/$defs/ExitResult/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key1 },
									message: "must NOT have additional properties"
								}];
								return false;
							}
							if (data1.shutting_down !== void 0) {
								if (typeof data1.shutting_down !== "boolean") {
									validate180.errors = [{
										instancePath: instancePath + "/data/shutting_down",
										schemaPath: "#/$defs/ExitResult/properties/shutting_down/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
							}
						}
					} else {
						validate180.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/ExitResult/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate180.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate180.errors = vErrors;
	return true;
}
validate180.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema250 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema251 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema252 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate183(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate183.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate183.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate183.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate183.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate183.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema251.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate183.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate183.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate183.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema252.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate183.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema250.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate183.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate183.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate183.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate183.errors = vErrors;
	return true;
}
validate183.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate182(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate182.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate182.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate182.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate182.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate182.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema246.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate183(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate183.errors : vErrors.concat(validate183.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate182.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate182.errors = vErrors;
	return errors === 0;
}
validate182.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate179(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate179.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate180(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate180.errors : vErrors.concat(validate180.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate182(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate182.errors : vErrors.concat(validate182.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate179.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate179.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate179.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateGlobalConfigurationGetRequest = validate186;
function validate186(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate186.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id")) {
			validate186.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id")) {
				validate186.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate186.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
			}
		}
	} else {
		validate186.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate186.errors = vErrors;
	return true;
}
validate186.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateGlobalConfigurationGetResponse = validate187;
var schema256 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema260 = {
	"type": "string",
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	]
};
var schema262 = {
	"type": "string",
	"enum": ["off", "enabled"]
};
function validate191(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate191.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate191.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "temperature" || key0 === "top_p" || key0 === "max_output_tokens" || key0 === "input_budget" || key0 === "reasoning")) {
				validate191.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.temperature !== void 0) {
				let data0 = data.temperature;
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 2 || isNaN(data0)) {
						validate191.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 2
							},
							message: "must be <= 2"
						}];
						return false;
					} else if (data0 < 0 || isNaN(data0)) {
						validate191.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: 0
							},
							message: "must be >= 0"
						}];
						return false;
					}
				} else {
					validate191.errors = [{
						instancePath: instancePath + "/temperature",
						schemaPath: "#/properties/temperature/type",
						keyword: "type",
						params: { type: "number" },
						message: "must be number"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.top_p !== void 0) {
					let data1 = data.top_p;
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 1 || isNaN(data1)) {
							validate191.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 1
								},
								message: "must be <= 1"
							}];
							return false;
						} else if (data1 < 0 || isNaN(data1)) {
							validate191.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/minimum",
								keyword: "minimum",
								params: {
									comparison: ">=",
									limit: 0
								},
								message: "must be >= 0"
							}];
							return false;
						}
					} else {
						validate191.errors = [{
							instancePath: instancePath + "/top_p",
							schemaPath: "#/properties/top_p/type",
							keyword: "type",
							params: { type: "number" },
							message: "must be number"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.max_output_tokens !== void 0) {
						let data2 = data.max_output_tokens;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate191.errors = [{
								instancePath: instancePath + "/max_output_tokens",
								schemaPath: "#/properties/max_output_tokens/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 32768 || isNaN(data2)) {
								validate191.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 32768
									},
									message: "must be <= 32768"
								}];
								return false;
							} else if (data2 < 1 || isNaN(data2)) {
								validate191.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 1
									},
									message: "must be >= 1"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.input_budget !== void 0) {
							let data3 = data.input_budget;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
								validate191.errors = [{
									instancePath: instancePath + "/input_budget",
									schemaPath: "#/properties/input_budget/type",
									keyword: "type",
									params: { type: "integer" },
									message: "must be integer"
								}];
								return false;
							}
							if (typeof data3 == "number" && isFinite(data3)) {
								if (data3 > 128e3 || isNaN(data3)) {
									validate191.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 128e3
										},
										message: "must be <= 128000"
									}];
									return false;
								} else if (data3 < 256 || isNaN(data3)) {
									validate191.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: 256
										},
										message: "must be >= 256"
									}];
									return false;
								}
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.reasoning !== void 0) {
								let data4 = data.reasoning;
								if (typeof data4 !== "string") {
									validate191.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "off" || data4 === "enabled")) {
									validate191.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/enum",
										keyword: "enum",
										params: { allowedValues: schema262.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate191.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate191.errors = vErrors;
	return true;
}
validate191.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate190(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate190.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters") || data.revision === void 0 && (missing0 = "revision") || data.credential_configured === void 0 && (missing0 = "credential_configured")) {
				validate190.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "protocol" || key0 === "base_url" || key0 === "model_name" || key0 === "parameters" || key0 === "revision" || key0 === "credential_configured")) {
					validate190.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.id !== void 0) {
						const _errs2 = errors;
						if (typeof data.id !== "string") {
							validate190.errors = [{
								instancePath: instancePath + "/id",
								schemaPath: "#/properties/id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.name !== void 0) {
							const _errs4 = errors;
							if (typeof data.name !== "string") {
								validate190.errors = [{
									instancePath: instancePath + "/name",
									schemaPath: "#/properties/name/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.protocol !== void 0) {
								let data2 = data.protocol;
								const _errs6 = errors;
								if (typeof data2 !== "string") {
									validate190.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data2 === "openai_chat_completions" || data2 === "anthropic_messages" || data2 === "openai_responses")) {
									validate190.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema260.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.base_url !== void 0) {
									const _errs9 = errors;
									if (typeof data.base_url !== "string") {
										validate190.errors = [{
											instancePath: instancePath + "/base_url",
											schemaPath: "#/properties/base_url/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.model_name !== void 0) {
										const _errs11 = errors;
										if (typeof data.model_name !== "string") {
											validate190.errors = [{
												instancePath: instancePath + "/model_name",
												schemaPath: "#/properties/model_name/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.parameters !== void 0) {
											const _errs13 = errors;
											if (!validate191(data.parameters, {
												instancePath: instancePath + "/parameters",
												parentData: data,
												parentDataProperty: "parameters",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate191.errors : vErrors.concat(validate191.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.revision !== void 0) {
												let data6 = data.revision;
												const _errs14 = errors;
												if (errors === errors) {
													if (typeof data6 === "string") {
														if (func2(data6) > 19) {
															validate190.errors = [{
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data6)) {
															validate190.errors = [{
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate190.errors = [{
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs14 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.credential_configured !== void 0) {
													const _errs17 = errors;
													if (typeof data.credential_configured !== "boolean") {
														validate190.errors = [{
															instancePath: instancePath + "/credential_configured",
															schemaPath: "#/properties/credential_configured/type",
															keyword: "type",
															params: { type: "boolean" },
															message: "must be boolean"
														}];
														return false;
													}
													var valid0 = _errs17 === errors;
												} else var valid0 = true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate190.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate190.errors = vErrors;
	return errors === 0;
}
validate190.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate194(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate194.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.language_style === void 0 && (missing0 = "language_style") || data.address_terms === void 0 && (missing0 = "address_terms") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.revision === void 0 && (missing0 = "revision")) {
			validate194.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "language_style" || key0 === "address_terms" || key0 === "skill" || key0 === "dimensions" || key0 === "revision")) {
				validate194.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.id !== void 0) {
				if (typeof data.id !== "string") {
					validate194.errors = [{
						instancePath: instancePath + "/id",
						schemaPath: "#/properties/id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.name !== void 0) {
					if (typeof data.name !== "string") {
						validate194.errors = [{
							instancePath: instancePath + "/name",
							schemaPath: "#/properties/name/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.language_style !== void 0) {
						if (typeof data.language_style !== "string") {
							validate194.errors = [{
								instancePath: instancePath + "/language_style",
								schemaPath: "#/properties/language_style/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.address_terms !== void 0) {
							let data3 = data.address_terms;
							if (Array.isArray(data3)) {
								const len0 = data3.length;
								for (let i0 = 0; i0 < len0; i0++) if (typeof data3[i0] !== "string") {
									validate194.errors = [{
										instancePath: instancePath + "/address_terms/" + i0,
										schemaPath: "#/properties/address_terms/items/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							} else {
								validate194.errors = [{
									instancePath: instancePath + "/address_terms",
									schemaPath: "#/properties/address_terms/type",
									keyword: "type",
									params: { type: "array" },
									message: "must be array"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.skill !== void 0) {
								if (typeof data.skill !== "string") {
									validate194.errors = [{
										instancePath: instancePath + "/skill",
										schemaPath: "#/properties/skill/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.dimensions !== void 0) {
									let data6 = data.dimensions;
									if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
										let missing1;
										if (data6.professional === void 0 && (missing1 = "professional") || data6.formal === void 0 && (missing1 = "formal") || data6.casual === void 0 && (missing1 = "casual") || data6.humor === void 0 && (missing1 = "humor") || data6.direct === void 0 && (missing1 = "direct") || data6.empathy === void 0 && (missing1 = "empathy") || data6.social_energy === void 0 && (missing1 = "social_energy")) {
											validate194.errors = [{
												instancePath: instancePath + "/dimensions",
												schemaPath: "#/$defs/PersonaDimensions/required",
												keyword: "required",
												params: { missingProperty: missing1 },
												message: "must have required property '" + missing1 + "'"
											}];
											return false;
										} else {
											for (const key1 in data6) if (!(key1 === "professional" || key1 === "formal" || key1 === "casual" || key1 === "humor" || key1 === "direct" || key1 === "empathy" || key1 === "social_energy")) {
												validate194.errors = [{
													instancePath: instancePath + "/dimensions",
													schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
													keyword: "additionalProperties",
													params: { additionalProperty: key1 },
													message: "must NOT have additional properties"
												}];
												return false;
											}
											if (data6.professional !== void 0) {
												let data7 = data6.professional;
												if (!(typeof data7 == "number" && !(data7 % 1) && !isNaN(data7) && isFinite(data7))) {
													validate194.errors = [{
														instancePath: instancePath + "/dimensions/professional",
														schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
														keyword: "type",
														params: { type: "integer" },
														message: "must be integer"
													}];
													return false;
												}
												if (typeof data7 == "number" && isFinite(data7)) {
													if (data7 > 100 || isNaN(data7)) {
														validate194.errors = [{
															instancePath: instancePath + "/dimensions/professional",
															schemaPath: "#/$defs/PersonaDimensions/properties/professional/maximum",
															keyword: "maximum",
															params: {
																comparison: "<=",
																limit: 100
															},
															message: "must be <= 100"
														}];
														return false;
													} else if (data7 < 0 || isNaN(data7)) {
														validate194.errors = [{
															instancePath: instancePath + "/dimensions/professional",
															schemaPath: "#/$defs/PersonaDimensions/properties/professional/minimum",
															keyword: "minimum",
															params: {
																comparison: ">=",
																limit: 0
															},
															message: "must be >= 0"
														}];
														return false;
													}
												}
												var valid3 = true;
											} else var valid3 = true;
											if (valid3) {
												if (data6.formal !== void 0) {
													let data8 = data6.formal;
													if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
														validate194.errors = [{
															instancePath: instancePath + "/dimensions/formal",
															schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
															keyword: "type",
															params: { type: "integer" },
															message: "must be integer"
														}];
														return false;
													}
													if (typeof data8 == "number" && isFinite(data8)) {
														if (data8 > 100 || isNaN(data8)) {
															validate194.errors = [{
																instancePath: instancePath + "/dimensions/formal",
																schemaPath: "#/$defs/PersonaDimensions/properties/formal/maximum",
																keyword: "maximum",
																params: {
																	comparison: "<=",
																	limit: 100
																},
																message: "must be <= 100"
															}];
															return false;
														} else if (data8 < 0 || isNaN(data8)) {
															validate194.errors = [{
																instancePath: instancePath + "/dimensions/formal",
																schemaPath: "#/$defs/PersonaDimensions/properties/formal/minimum",
																keyword: "minimum",
																params: {
																	comparison: ">=",
																	limit: 0
																},
																message: "must be >= 0"
															}];
															return false;
														}
													}
													var valid3 = true;
												} else var valid3 = true;
												if (valid3) {
													if (data6.casual !== void 0) {
														let data9 = data6.casual;
														if (!(typeof data9 == "number" && !(data9 % 1) && !isNaN(data9) && isFinite(data9))) {
															validate194.errors = [{
																instancePath: instancePath + "/dimensions/casual",
																schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (typeof data9 == "number" && isFinite(data9)) {
															if (data9 > 100 || isNaN(data9)) {
																validate194.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/maximum",
																	keyword: "maximum",
																	params: {
																		comparison: "<=",
																		limit: 100
																	},
																	message: "must be <= 100"
																}];
																return false;
															} else if (data9 < 0 || isNaN(data9)) {
																validate194.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/minimum",
																	keyword: "minimum",
																	params: {
																		comparison: ">=",
																		limit: 0
																	},
																	message: "must be >= 0"
																}];
																return false;
															}
														}
														var valid3 = true;
													} else var valid3 = true;
													if (valid3) {
														if (data6.humor !== void 0) {
															let data10 = data6.humor;
															if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																validate194.errors = [{
																	instancePath: instancePath + "/dimensions/humor",
																	schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																}];
																return false;
															}
															if (typeof data10 == "number" && isFinite(data10)) {
																if (data10 > 100 || isNaN(data10)) {
																	validate194.errors = [{
																		instancePath: instancePath + "/dimensions/humor",
																		schemaPath: "#/$defs/PersonaDimensions/properties/humor/maximum",
																		keyword: "maximum",
																		params: {
																			comparison: "<=",
																			limit: 100
																		},
																		message: "must be <= 100"
																	}];
																	return false;
																} else if (data10 < 0 || isNaN(data10)) {
																	validate194.errors = [{
																		instancePath: instancePath + "/dimensions/humor",
																		schemaPath: "#/$defs/PersonaDimensions/properties/humor/minimum",
																		keyword: "minimum",
																		params: {
																			comparison: ">=",
																			limit: 0
																		},
																		message: "must be >= 0"
																	}];
																	return false;
																}
															}
															var valid3 = true;
														} else var valid3 = true;
														if (valid3) {
															if (data6.direct !== void 0) {
																let data11 = data6.direct;
																if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																	validate194.errors = [{
																		instancePath: instancePath + "/dimensions/direct",
																		schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																		keyword: "type",
																		params: { type: "integer" },
																		message: "must be integer"
																	}];
																	return false;
																}
																if (typeof data11 == "number" && isFinite(data11)) {
																	if (data11 > 100 || isNaN(data11)) {
																		validate194.errors = [{
																			instancePath: instancePath + "/dimensions/direct",
																			schemaPath: "#/$defs/PersonaDimensions/properties/direct/maximum",
																			keyword: "maximum",
																			params: {
																				comparison: "<=",
																				limit: 100
																			},
																			message: "must be <= 100"
																		}];
																		return false;
																	} else if (data11 < 0 || isNaN(data11)) {
																		validate194.errors = [{
																			instancePath: instancePath + "/dimensions/direct",
																			schemaPath: "#/$defs/PersonaDimensions/properties/direct/minimum",
																			keyword: "minimum",
																			params: {
																				comparison: ">=",
																				limit: 0
																			},
																			message: "must be >= 0"
																		}];
																		return false;
																	}
																}
																var valid3 = true;
															} else var valid3 = true;
															if (valid3) {
																if (data6.empathy !== void 0) {
																	let data12 = data6.empathy;
																	if (!(typeof data12 == "number" && !(data12 % 1) && !isNaN(data12) && isFinite(data12))) {
																		validate194.errors = [{
																			instancePath: instancePath + "/dimensions/empathy",
																			schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																			keyword: "type",
																			params: { type: "integer" },
																			message: "must be integer"
																		}];
																		return false;
																	}
																	if (typeof data12 == "number" && isFinite(data12)) {
																		if (data12 > 100 || isNaN(data12)) {
																			validate194.errors = [{
																				instancePath: instancePath + "/dimensions/empathy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/empathy/maximum",
																				keyword: "maximum",
																				params: {
																					comparison: "<=",
																					limit: 100
																				},
																				message: "must be <= 100"
																			}];
																			return false;
																		} else if (data12 < 0 || isNaN(data12)) {
																			validate194.errors = [{
																				instancePath: instancePath + "/dimensions/empathy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/empathy/minimum",
																				keyword: "minimum",
																				params: {
																					comparison: ">=",
																					limit: 0
																				},
																				message: "must be >= 0"
																			}];
																			return false;
																		}
																	}
																	var valid3 = true;
																} else var valid3 = true;
																if (valid3) {
																	if (data6.social_energy !== void 0) {
																		let data13 = data6.social_energy;
																		if (!(typeof data13 == "number" && !(data13 % 1) && !isNaN(data13) && isFinite(data13))) {
																			validate194.errors = [{
																				instancePath: instancePath + "/dimensions/social_energy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																				keyword: "type",
																				params: { type: "integer" },
																				message: "must be integer"
																			}];
																			return false;
																		}
																		if (typeof data13 == "number" && isFinite(data13)) {
																			if (data13 > 100 || isNaN(data13)) {
																				validate194.errors = [{
																					instancePath: instancePath + "/dimensions/social_energy",
																					schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/maximum",
																					keyword: "maximum",
																					params: {
																						comparison: "<=",
																						limit: 100
																					},
																					message: "must be <= 100"
																				}];
																				return false;
																			} else if (data13 < 0 || isNaN(data13)) {
																				validate194.errors = [{
																					instancePath: instancePath + "/dimensions/social_energy",
																					schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/minimum",
																					keyword: "minimum",
																					params: {
																						comparison: ">=",
																						limit: 0
																					},
																					message: "must be >= 0"
																				}];
																				return false;
																			}
																		}
																		var valid3 = true;
																	} else var valid3 = true;
																}
															}
														}
													}
												}
											}
										}
									} else {
										validate194.errors = [{
											instancePath: instancePath + "/dimensions",
											schemaPath: "#/$defs/PersonaDimensions/type",
											keyword: "type",
											params: { type: "object" },
											message: "must be object"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.revision !== void 0) {
										let data14 = data.revision;
										if (typeof data14 === "string") {
											if (func2(data14) > 19) {
												validate194.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												}];
												return false;
											} else if (!pattern4.test(data14)) {
												validate194.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												}];
												return false;
											}
										} else {
											validate194.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = true;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate194.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate194.errors = vErrors;
	return true;
}
validate194.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate189(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate189.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.revision === void 0 && (missing0 = "revision") || data.model_profiles === void 0 && (missing0 = "model_profiles") || data.persona_presets === void 0 && (missing0 = "persona_presets") || data.runtime_defaults === void 0 && (missing0 = "runtime_defaults")) {
				validate189.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "revision" || key0 === "model_profiles" || key0 === "persona_presets" || key0 === "runtime_defaults")) {
					validate189.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.revision !== void 0) {
						let data0 = data.revision;
						const _errs2 = errors;
						if (errors === errors) {
							if (typeof data0 === "string") {
								if (func2(data0) > 19) {
									validate189.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									}];
									return false;
								} else if (!pattern4.test(data0)) {
									validate189.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									}];
									return false;
								}
							} else {
								validate189.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.model_profiles !== void 0) {
							let data1 = data.model_profiles;
							const _errs5 = errors;
							if (errors === _errs5) {
								if (Array.isArray(data1)) {
									const len0 = data1.length;
									for (let i0 = 0; i0 < len0; i0++) {
										const _errs7 = errors;
										if (!validate190(data1[i0], {
											instancePath: instancePath + "/model_profiles/" + i0,
											parentData: data1,
											parentDataProperty: i0,
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate190.errors : vErrors.concat(validate190.errors);
											errors = vErrors.length;
										}
										if (!(_errs7 === errors)) break;
									}
								} else {
									validate189.errors = [{
										instancePath: instancePath + "/model_profiles",
										schemaPath: "#/properties/model_profiles/type",
										keyword: "type",
										params: { type: "array" },
										message: "must be array"
									}];
									return false;
								}
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.persona_presets !== void 0) {
								let data3 = data.persona_presets;
								const _errs8 = errors;
								if (errors === _errs8) {
									if (Array.isArray(data3)) {
										const len1 = data3.length;
										for (let i1 = 0; i1 < len1; i1++) {
											const _errs10 = errors;
											if (!validate194(data3[i1], {
												instancePath: instancePath + "/persona_presets/" + i1,
												parentData: data3,
												parentDataProperty: i1,
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate194.errors : vErrors.concat(validate194.errors);
												errors = vErrors.length;
											}
											if (!(_errs10 === errors)) break;
										}
									} else {
										validate189.errors = [{
											instancePath: instancePath + "/persona_presets",
											schemaPath: "#/properties/persona_presets/type",
											keyword: "type",
											params: { type: "array" },
											message: "must be array"
										}];
										return false;
									}
								}
								var valid0 = _errs8 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.runtime_defaults !== void 0) {
									let data5 = data.runtime_defaults;
									const _errs11 = errors;
									if (errors === errors) {
										if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
											let missing1;
											if (data5.request_limit_daily === void 0 && (missing1 = "request_limit_daily") || data5.persistent_memory === void 0 && (missing1 = "persistent_memory") || data5.allow_autonomous_wake === void 0 && (missing1 = "allow_autonomous_wake")) {
												validate189.errors = [{
													instancePath: instancePath + "/runtime_defaults",
													schemaPath: "#/$defs/AgentPreferences/required",
													keyword: "required",
													params: { missingProperty: missing1 },
													message: "must have required property '" + missing1 + "'"
												}];
												return false;
											} else {
												const _errs14 = errors;
												for (const key1 in data5) if (!(key1 === "request_limit_daily" || key1 === "persistent_memory" || key1 === "allow_autonomous_wake")) {
													validate189.errors = [{
														instancePath: instancePath + "/runtime_defaults",
														schemaPath: "#/$defs/AgentPreferences/additionalProperties",
														keyword: "additionalProperties",
														params: { additionalProperty: key1 },
														message: "must NOT have additional properties"
													}];
													return false;
												}
												if (_errs14 === errors) {
													if (data5.request_limit_daily !== void 0) {
														let data6 = data5.request_limit_daily;
														const _errs15 = errors;
														if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
															validate189.errors = [{
																instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (errors === _errs15) {
															if (typeof data6 == "number" && isFinite(data6)) {
																if (data6 > 5e3 || isNaN(data6)) {
																	validate189.errors = [{
																		instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																		schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/maximum",
																		keyword: "maximum",
																		params: {
																			comparison: "<=",
																			limit: 5e3
																		},
																		message: "must be <= 5000"
																	}];
																	return false;
																} else if (data6 < 1 || isNaN(data6)) {
																	validate189.errors = [{
																		instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																		schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/minimum",
																		keyword: "minimum",
																		params: {
																			comparison: ">=",
																			limit: 1
																		},
																		message: "must be >= 1"
																	}];
																	return false;
																}
															}
														}
														var valid5 = _errs15 === errors;
													} else var valid5 = true;
													if (valid5) {
														if (data5.persistent_memory !== void 0) {
															const _errs17 = errors;
															if (typeof data5.persistent_memory !== "boolean") {
																validate189.errors = [{
																	instancePath: instancePath + "/runtime_defaults/persistent_memory",
																	schemaPath: "#/$defs/AgentPreferences/properties/persistent_memory/type",
																	keyword: "type",
																	params: { type: "boolean" },
																	message: "must be boolean"
																}];
																return false;
															}
															var valid5 = _errs17 === errors;
														} else var valid5 = true;
														if (valid5) {
															if (data5.allow_autonomous_wake !== void 0) {
																const _errs19 = errors;
																if (typeof data5.allow_autonomous_wake !== "boolean") {
																	validate189.errors = [{
																		instancePath: instancePath + "/runtime_defaults/allow_autonomous_wake",
																		schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																		keyword: "type",
																		params: { type: "boolean" },
																		message: "must be boolean"
																	}];
																	return false;
																}
																var valid5 = _errs19 === errors;
															} else var valid5 = true;
														}
													}
												}
											}
										} else {
											validate189.errors = [{
												instancePath: instancePath + "/runtime_defaults",
												schemaPath: "#/$defs/AgentPreferences/type",
												keyword: "type",
												params: { type: "object" },
												message: "must be object"
											}];
											return false;
										}
									}
									var valid0 = _errs11 === errors;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		} else {
			validate189.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate189.errors = vErrors;
	return errors === 0;
}
validate189.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate188(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate188.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate188.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate188.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate188.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate188.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema256.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate189(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate189.errors : vErrors.concat(validate189.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate188.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate188.errors = vErrors;
	return errors === 0;
}
validate188.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema270 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema271 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema272 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate199(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate199.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate199.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate199.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate199.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate199.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema271.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate199.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate199.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate199.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema272.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate199.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema270.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate199.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate199.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate199.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate199.errors = vErrors;
	return true;
}
validate199.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate198(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate198.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate198.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate198.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate198.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate198.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema256.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate199(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate199.errors : vErrors.concat(validate199.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate198.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate198.errors = vErrors;
	return errors === 0;
}
validate198.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate187(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate187.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate188(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate188.errors : vErrors.concat(validate188.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate198(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate198.errors : vErrors.concat(validate198.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate187.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate187.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate187.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateGlobalConfigurationSaveRequest = validate202;
var schema276 = {
	"type": "string",
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	]
};
var schema278 = {
	"type": "string",
	"enum": ["off", "enabled"]
};
function validate204(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate204.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate204.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "temperature" || key0 === "top_p" || key0 === "max_output_tokens" || key0 === "input_budget" || key0 === "reasoning")) {
				validate204.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.temperature !== void 0) {
				let data0 = data.temperature;
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 2 || isNaN(data0)) {
						validate204.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 2
							},
							message: "must be <= 2"
						}];
						return false;
					} else if (data0 < 0 || isNaN(data0)) {
						validate204.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: 0
							},
							message: "must be >= 0"
						}];
						return false;
					}
				} else {
					validate204.errors = [{
						instancePath: instancePath + "/temperature",
						schemaPath: "#/properties/temperature/type",
						keyword: "type",
						params: { type: "number" },
						message: "must be number"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.top_p !== void 0) {
					let data1 = data.top_p;
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 1 || isNaN(data1)) {
							validate204.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 1
								},
								message: "must be <= 1"
							}];
							return false;
						} else if (data1 < 0 || isNaN(data1)) {
							validate204.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/minimum",
								keyword: "minimum",
								params: {
									comparison: ">=",
									limit: 0
								},
								message: "must be >= 0"
							}];
							return false;
						}
					} else {
						validate204.errors = [{
							instancePath: instancePath + "/top_p",
							schemaPath: "#/properties/top_p/type",
							keyword: "type",
							params: { type: "number" },
							message: "must be number"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.max_output_tokens !== void 0) {
						let data2 = data.max_output_tokens;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate204.errors = [{
								instancePath: instancePath + "/max_output_tokens",
								schemaPath: "#/properties/max_output_tokens/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 32768 || isNaN(data2)) {
								validate204.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 32768
									},
									message: "must be <= 32768"
								}];
								return false;
							} else if (data2 < 1 || isNaN(data2)) {
								validate204.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 1
									},
									message: "must be >= 1"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.input_budget !== void 0) {
							let data3 = data.input_budget;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
								validate204.errors = [{
									instancePath: instancePath + "/input_budget",
									schemaPath: "#/properties/input_budget/type",
									keyword: "type",
									params: { type: "integer" },
									message: "must be integer"
								}];
								return false;
							}
							if (typeof data3 == "number" && isFinite(data3)) {
								if (data3 > 128e3 || isNaN(data3)) {
									validate204.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 128e3
										},
										message: "must be <= 128000"
									}];
									return false;
								} else if (data3 < 256 || isNaN(data3)) {
									validate204.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: 256
										},
										message: "must be >= 256"
									}];
									return false;
								}
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.reasoning !== void 0) {
								let data4 = data.reasoning;
								if (typeof data4 !== "string") {
									validate204.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "off" || data4 === "enabled")) {
									validate204.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/enum",
										keyword: "enum",
										params: { allowedValues: schema278.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate204.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate204.errors = vErrors;
	return true;
}
validate204.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate203(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate203.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters")) {
				validate203.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "protocol" || key0 === "base_url" || key0 === "model_name" || key0 === "parameters")) {
					validate203.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.id !== void 0) {
						const _errs2 = errors;
						if (typeof data.id !== "string") {
							validate203.errors = [{
								instancePath: instancePath + "/id",
								schemaPath: "#/properties/id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.name !== void 0) {
							let data1 = data.name;
							const _errs4 = errors;
							if (errors === _errs4) {
								if (typeof data1 === "string") {
									if (func2(data1) > 80) {
										validate203.errors = [{
											instancePath: instancePath + "/name",
											schemaPath: "#/properties/name/maxLength",
											keyword: "maxLength",
											params: { limit: 80 },
											message: "must NOT have more than 80 characters"
										}];
										return false;
									} else if (func2(data1) < 1) {
										validate203.errors = [{
											instancePath: instancePath + "/name",
											schemaPath: "#/properties/name/minLength",
											keyword: "minLength",
											params: { limit: 1 },
											message: "must NOT have fewer than 1 characters"
										}];
										return false;
									}
								} else {
									validate203.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.protocol !== void 0) {
								let data2 = data.protocol;
								const _errs6 = errors;
								if (typeof data2 !== "string") {
									validate203.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data2 === "openai_chat_completions" || data2 === "anthropic_messages" || data2 === "openai_responses")) {
									validate203.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema276.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.base_url !== void 0) {
									let data3 = data.base_url;
									const _errs9 = errors;
									if (errors === _errs9) {
										if (typeof data3 === "string") {
											if (func2(data3) > 2048) {
												validate203.errors = [{
													instancePath: instancePath + "/base_url",
													schemaPath: "#/properties/base_url/maxLength",
													keyword: "maxLength",
													params: { limit: 2048 },
													message: "must NOT have more than 2048 characters"
												}];
												return false;
											} else if (func2(data3) < 1) {
												validate203.errors = [{
													instancePath: instancePath + "/base_url",
													schemaPath: "#/properties/base_url/minLength",
													keyword: "minLength",
													params: { limit: 1 },
													message: "must NOT have fewer than 1 characters"
												}];
												return false;
											}
										} else {
											validate203.errors = [{
												instancePath: instancePath + "/base_url",
												schemaPath: "#/properties/base_url/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.model_name !== void 0) {
										let data4 = data.model_name;
										const _errs11 = errors;
										if (errors === _errs11) {
											if (typeof data4 === "string") {
												if (func2(data4) > 200) {
													validate203.errors = [{
														instancePath: instancePath + "/model_name",
														schemaPath: "#/properties/model_name/maxLength",
														keyword: "maxLength",
														params: { limit: 200 },
														message: "must NOT have more than 200 characters"
													}];
													return false;
												} else if (func2(data4) < 1) {
													validate203.errors = [{
														instancePath: instancePath + "/model_name",
														schemaPath: "#/properties/model_name/minLength",
														keyword: "minLength",
														params: { limit: 1 },
														message: "must NOT have fewer than 1 characters"
													}];
													return false;
												}
											} else {
												validate203.errors = [{
													instancePath: instancePath + "/model_name",
													schemaPath: "#/properties/model_name/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.parameters !== void 0) {
											const _errs13 = errors;
											if (!validate204(data.parameters, {
												instancePath: instancePath + "/parameters",
												parentData: data,
												parentDataProperty: "parameters",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate204.errors : vErrors.concat(validate204.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate203.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate203.errors = vErrors;
	return errors === 0;
}
validate203.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate207(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate207.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.language_style === void 0 && (missing0 = "language_style") || data.address_terms === void 0 && (missing0 = "address_terms") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.revision === void 0 && (missing0 = "revision")) {
			validate207.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "language_style" || key0 === "address_terms" || key0 === "skill" || key0 === "dimensions" || key0 === "revision")) {
				validate207.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.id !== void 0) {
				if (typeof data.id !== "string") {
					validate207.errors = [{
						instancePath: instancePath + "/id",
						schemaPath: "#/properties/id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.name !== void 0) {
					if (typeof data.name !== "string") {
						validate207.errors = [{
							instancePath: instancePath + "/name",
							schemaPath: "#/properties/name/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.language_style !== void 0) {
						if (typeof data.language_style !== "string") {
							validate207.errors = [{
								instancePath: instancePath + "/language_style",
								schemaPath: "#/properties/language_style/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.address_terms !== void 0) {
							let data3 = data.address_terms;
							if (Array.isArray(data3)) {
								const len0 = data3.length;
								for (let i0 = 0; i0 < len0; i0++) if (typeof data3[i0] !== "string") {
									validate207.errors = [{
										instancePath: instancePath + "/address_terms/" + i0,
										schemaPath: "#/properties/address_terms/items/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							} else {
								validate207.errors = [{
									instancePath: instancePath + "/address_terms",
									schemaPath: "#/properties/address_terms/type",
									keyword: "type",
									params: { type: "array" },
									message: "must be array"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.skill !== void 0) {
								if (typeof data.skill !== "string") {
									validate207.errors = [{
										instancePath: instancePath + "/skill",
										schemaPath: "#/properties/skill/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.dimensions !== void 0) {
									let data6 = data.dimensions;
									if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
										let missing1;
										if (data6.professional === void 0 && (missing1 = "professional") || data6.formal === void 0 && (missing1 = "formal") || data6.casual === void 0 && (missing1 = "casual") || data6.humor === void 0 && (missing1 = "humor") || data6.direct === void 0 && (missing1 = "direct") || data6.empathy === void 0 && (missing1 = "empathy") || data6.social_energy === void 0 && (missing1 = "social_energy")) {
											validate207.errors = [{
												instancePath: instancePath + "/dimensions",
												schemaPath: "#/$defs/PersonaDimensions/required",
												keyword: "required",
												params: { missingProperty: missing1 },
												message: "must have required property '" + missing1 + "'"
											}];
											return false;
										} else {
											for (const key1 in data6) if (!(key1 === "professional" || key1 === "formal" || key1 === "casual" || key1 === "humor" || key1 === "direct" || key1 === "empathy" || key1 === "social_energy")) {
												validate207.errors = [{
													instancePath: instancePath + "/dimensions",
													schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
													keyword: "additionalProperties",
													params: { additionalProperty: key1 },
													message: "must NOT have additional properties"
												}];
												return false;
											}
											if (data6.professional !== void 0) {
												let data7 = data6.professional;
												if (!(typeof data7 == "number" && !(data7 % 1) && !isNaN(data7) && isFinite(data7))) {
													validate207.errors = [{
														instancePath: instancePath + "/dimensions/professional",
														schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
														keyword: "type",
														params: { type: "integer" },
														message: "must be integer"
													}];
													return false;
												}
												if (typeof data7 == "number" && isFinite(data7)) {
													if (data7 > 100 || isNaN(data7)) {
														validate207.errors = [{
															instancePath: instancePath + "/dimensions/professional",
															schemaPath: "#/$defs/PersonaDimensions/properties/professional/maximum",
															keyword: "maximum",
															params: {
																comparison: "<=",
																limit: 100
															},
															message: "must be <= 100"
														}];
														return false;
													} else if (data7 < 0 || isNaN(data7)) {
														validate207.errors = [{
															instancePath: instancePath + "/dimensions/professional",
															schemaPath: "#/$defs/PersonaDimensions/properties/professional/minimum",
															keyword: "minimum",
															params: {
																comparison: ">=",
																limit: 0
															},
															message: "must be >= 0"
														}];
														return false;
													}
												}
												var valid3 = true;
											} else var valid3 = true;
											if (valid3) {
												if (data6.formal !== void 0) {
													let data8 = data6.formal;
													if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
														validate207.errors = [{
															instancePath: instancePath + "/dimensions/formal",
															schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
															keyword: "type",
															params: { type: "integer" },
															message: "must be integer"
														}];
														return false;
													}
													if (typeof data8 == "number" && isFinite(data8)) {
														if (data8 > 100 || isNaN(data8)) {
															validate207.errors = [{
																instancePath: instancePath + "/dimensions/formal",
																schemaPath: "#/$defs/PersonaDimensions/properties/formal/maximum",
																keyword: "maximum",
																params: {
																	comparison: "<=",
																	limit: 100
																},
																message: "must be <= 100"
															}];
															return false;
														} else if (data8 < 0 || isNaN(data8)) {
															validate207.errors = [{
																instancePath: instancePath + "/dimensions/formal",
																schemaPath: "#/$defs/PersonaDimensions/properties/formal/minimum",
																keyword: "minimum",
																params: {
																	comparison: ">=",
																	limit: 0
																},
																message: "must be >= 0"
															}];
															return false;
														}
													}
													var valid3 = true;
												} else var valid3 = true;
												if (valid3) {
													if (data6.casual !== void 0) {
														let data9 = data6.casual;
														if (!(typeof data9 == "number" && !(data9 % 1) && !isNaN(data9) && isFinite(data9))) {
															validate207.errors = [{
																instancePath: instancePath + "/dimensions/casual",
																schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (typeof data9 == "number" && isFinite(data9)) {
															if (data9 > 100 || isNaN(data9)) {
																validate207.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/maximum",
																	keyword: "maximum",
																	params: {
																		comparison: "<=",
																		limit: 100
																	},
																	message: "must be <= 100"
																}];
																return false;
															} else if (data9 < 0 || isNaN(data9)) {
																validate207.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/minimum",
																	keyword: "minimum",
																	params: {
																		comparison: ">=",
																		limit: 0
																	},
																	message: "must be >= 0"
																}];
																return false;
															}
														}
														var valid3 = true;
													} else var valid3 = true;
													if (valid3) {
														if (data6.humor !== void 0) {
															let data10 = data6.humor;
															if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																validate207.errors = [{
																	instancePath: instancePath + "/dimensions/humor",
																	schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																}];
																return false;
															}
															if (typeof data10 == "number" && isFinite(data10)) {
																if (data10 > 100 || isNaN(data10)) {
																	validate207.errors = [{
																		instancePath: instancePath + "/dimensions/humor",
																		schemaPath: "#/$defs/PersonaDimensions/properties/humor/maximum",
																		keyword: "maximum",
																		params: {
																			comparison: "<=",
																			limit: 100
																		},
																		message: "must be <= 100"
																	}];
																	return false;
																} else if (data10 < 0 || isNaN(data10)) {
																	validate207.errors = [{
																		instancePath: instancePath + "/dimensions/humor",
																		schemaPath: "#/$defs/PersonaDimensions/properties/humor/minimum",
																		keyword: "minimum",
																		params: {
																			comparison: ">=",
																			limit: 0
																		},
																		message: "must be >= 0"
																	}];
																	return false;
																}
															}
															var valid3 = true;
														} else var valid3 = true;
														if (valid3) {
															if (data6.direct !== void 0) {
																let data11 = data6.direct;
																if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																	validate207.errors = [{
																		instancePath: instancePath + "/dimensions/direct",
																		schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																		keyword: "type",
																		params: { type: "integer" },
																		message: "must be integer"
																	}];
																	return false;
																}
																if (typeof data11 == "number" && isFinite(data11)) {
																	if (data11 > 100 || isNaN(data11)) {
																		validate207.errors = [{
																			instancePath: instancePath + "/dimensions/direct",
																			schemaPath: "#/$defs/PersonaDimensions/properties/direct/maximum",
																			keyword: "maximum",
																			params: {
																				comparison: "<=",
																				limit: 100
																			},
																			message: "must be <= 100"
																		}];
																		return false;
																	} else if (data11 < 0 || isNaN(data11)) {
																		validate207.errors = [{
																			instancePath: instancePath + "/dimensions/direct",
																			schemaPath: "#/$defs/PersonaDimensions/properties/direct/minimum",
																			keyword: "minimum",
																			params: {
																				comparison: ">=",
																				limit: 0
																			},
																			message: "must be >= 0"
																		}];
																		return false;
																	}
																}
																var valid3 = true;
															} else var valid3 = true;
															if (valid3) {
																if (data6.empathy !== void 0) {
																	let data12 = data6.empathy;
																	if (!(typeof data12 == "number" && !(data12 % 1) && !isNaN(data12) && isFinite(data12))) {
																		validate207.errors = [{
																			instancePath: instancePath + "/dimensions/empathy",
																			schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																			keyword: "type",
																			params: { type: "integer" },
																			message: "must be integer"
																		}];
																		return false;
																	}
																	if (typeof data12 == "number" && isFinite(data12)) {
																		if (data12 > 100 || isNaN(data12)) {
																			validate207.errors = [{
																				instancePath: instancePath + "/dimensions/empathy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/empathy/maximum",
																				keyword: "maximum",
																				params: {
																					comparison: "<=",
																					limit: 100
																				},
																				message: "must be <= 100"
																			}];
																			return false;
																		} else if (data12 < 0 || isNaN(data12)) {
																			validate207.errors = [{
																				instancePath: instancePath + "/dimensions/empathy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/empathy/minimum",
																				keyword: "minimum",
																				params: {
																					comparison: ">=",
																					limit: 0
																				},
																				message: "must be >= 0"
																			}];
																			return false;
																		}
																	}
																	var valid3 = true;
																} else var valid3 = true;
																if (valid3) {
																	if (data6.social_energy !== void 0) {
																		let data13 = data6.social_energy;
																		if (!(typeof data13 == "number" && !(data13 % 1) && !isNaN(data13) && isFinite(data13))) {
																			validate207.errors = [{
																				instancePath: instancePath + "/dimensions/social_energy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																				keyword: "type",
																				params: { type: "integer" },
																				message: "must be integer"
																			}];
																			return false;
																		}
																		if (typeof data13 == "number" && isFinite(data13)) {
																			if (data13 > 100 || isNaN(data13)) {
																				validate207.errors = [{
																					instancePath: instancePath + "/dimensions/social_energy",
																					schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/maximum",
																					keyword: "maximum",
																					params: {
																						comparison: "<=",
																						limit: 100
																					},
																					message: "must be <= 100"
																				}];
																				return false;
																			} else if (data13 < 0 || isNaN(data13)) {
																				validate207.errors = [{
																					instancePath: instancePath + "/dimensions/social_energy",
																					schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/minimum",
																					keyword: "minimum",
																					params: {
																						comparison: ">=",
																						limit: 0
																					},
																					message: "must be >= 0"
																				}];
																				return false;
																			}
																		}
																		var valid3 = true;
																	} else var valid3 = true;
																}
															}
														}
													}
												}
											}
										}
									} else {
										validate207.errors = [{
											instancePath: instancePath + "/dimensions",
											schemaPath: "#/$defs/PersonaDimensions/type",
											keyword: "type",
											params: { type: "object" },
											message: "must be object"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.revision !== void 0) {
										let data14 = data.revision;
										if (typeof data14 === "string") {
											if (func2(data14) > 19) {
												validate207.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												}];
												return false;
											} else if (!pattern4.test(data14)) {
												validate207.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												}];
												return false;
											}
										} else {
											validate207.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = true;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate207.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate207.errors = vErrors;
	return true;
}
validate207.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate202(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate202.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.model_profiles === void 0 && (missing0 = "model_profiles") || data.persona_presets === void 0 && (missing0 = "persona_presets") || data.runtime_defaults === void 0 && (missing0 = "runtime_defaults")) {
				validate202.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "client_request_id" || key0 === "expected_revision" || key0 === "model_profiles" || key0 === "persona_presets" || key0 === "runtime_defaults")) {
					validate202.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate202.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.client_request_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.client_request_id !== "string") {
								validate202.errors = [{
									instancePath: instancePath + "/client_request_id",
									schemaPath: "#/properties/client_request_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.expected_revision !== void 0) {
								let data2 = data.expected_revision;
								const _errs6 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											validate202.errors = [{
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate202.errors = [{
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate202.errors = [{
											instancePath: instancePath + "/expected_revision",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.model_profiles !== void 0) {
									let data3 = data.model_profiles;
									const _errs9 = errors;
									if (errors === _errs9) {
										if (Array.isArray(data3)) {
											const len0 = data3.length;
											for (let i0 = 0; i0 < len0; i0++) {
												const _errs11 = errors;
												if (!validate203(data3[i0], {
													instancePath: instancePath + "/model_profiles/" + i0,
													parentData: data3,
													parentDataProperty: i0,
													rootData,
													dynamicAnchors
												})) {
													vErrors = vErrors === null ? validate203.errors : vErrors.concat(validate203.errors);
													errors = vErrors.length;
												}
												if (!(_errs11 === errors)) break;
											}
										} else {
											validate202.errors = [{
												instancePath: instancePath + "/model_profiles",
												schemaPath: "#/properties/model_profiles/type",
												keyword: "type",
												params: { type: "array" },
												message: "must be array"
											}];
											return false;
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.persona_presets !== void 0) {
										let data5 = data.persona_presets;
										const _errs12 = errors;
										if (errors === _errs12) {
											if (Array.isArray(data5)) {
												const len1 = data5.length;
												for (let i1 = 0; i1 < len1; i1++) {
													const _errs14 = errors;
													if (!validate207(data5[i1], {
														instancePath: instancePath + "/persona_presets/" + i1,
														parentData: data5,
														parentDataProperty: i1,
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate207.errors : vErrors.concat(validate207.errors);
														errors = vErrors.length;
													}
													if (!(_errs14 === errors)) break;
												}
											} else {
												validate202.errors = [{
													instancePath: instancePath + "/persona_presets",
													schemaPath: "#/properties/persona_presets/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs12 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.runtime_defaults !== void 0) {
											let data7 = data.runtime_defaults;
											const _errs15 = errors;
											if (errors === errors) {
												if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
													let missing1;
													if (data7.request_limit_daily === void 0 && (missing1 = "request_limit_daily") || data7.persistent_memory === void 0 && (missing1 = "persistent_memory") || data7.allow_autonomous_wake === void 0 && (missing1 = "allow_autonomous_wake")) {
														validate202.errors = [{
															instancePath: instancePath + "/runtime_defaults",
															schemaPath: "#/$defs/AgentPreferences/required",
															keyword: "required",
															params: { missingProperty: missing1 },
															message: "must have required property '" + missing1 + "'"
														}];
														return false;
													} else {
														const _errs18 = errors;
														for (const key1 in data7) if (!(key1 === "request_limit_daily" || key1 === "persistent_memory" || key1 === "allow_autonomous_wake")) {
															validate202.errors = [{
																instancePath: instancePath + "/runtime_defaults",
																schemaPath: "#/$defs/AgentPreferences/additionalProperties",
																keyword: "additionalProperties",
																params: { additionalProperty: key1 },
																message: "must NOT have additional properties"
															}];
															return false;
														}
														if (_errs18 === errors) {
															if (data7.request_limit_daily !== void 0) {
																let data8 = data7.request_limit_daily;
																const _errs19 = errors;
																if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
																	validate202.errors = [{
																		instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																		schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/type",
																		keyword: "type",
																		params: { type: "integer" },
																		message: "must be integer"
																	}];
																	return false;
																}
																if (errors === _errs19) {
																	if (typeof data8 == "number" && isFinite(data8)) {
																		if (data8 > 5e3 || isNaN(data8)) {
																			validate202.errors = [{
																				instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																				schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/maximum",
																				keyword: "maximum",
																				params: {
																					comparison: "<=",
																					limit: 5e3
																				},
																				message: "must be <= 5000"
																			}];
																			return false;
																		} else if (data8 < 1 || isNaN(data8)) {
																			validate202.errors = [{
																				instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																				schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/minimum",
																				keyword: "minimum",
																				params: {
																					comparison: ">=",
																					limit: 1
																				},
																				message: "must be >= 1"
																			}];
																			return false;
																		}
																	}
																}
																var valid5 = _errs19 === errors;
															} else var valid5 = true;
															if (valid5) {
																if (data7.persistent_memory !== void 0) {
																	const _errs21 = errors;
																	if (typeof data7.persistent_memory !== "boolean") {
																		validate202.errors = [{
																			instancePath: instancePath + "/runtime_defaults/persistent_memory",
																			schemaPath: "#/$defs/AgentPreferences/properties/persistent_memory/type",
																			keyword: "type",
																			params: { type: "boolean" },
																			message: "must be boolean"
																		}];
																		return false;
																	}
																	var valid5 = _errs21 === errors;
																} else var valid5 = true;
																if (valid5) {
																	if (data7.allow_autonomous_wake !== void 0) {
																		const _errs23 = errors;
																		if (typeof data7.allow_autonomous_wake !== "boolean") {
																			validate202.errors = [{
																				instancePath: instancePath + "/runtime_defaults/allow_autonomous_wake",
																				schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																				keyword: "type",
																				params: { type: "boolean" },
																				message: "must be boolean"
																			}];
																			return false;
																		}
																		var valid5 = _errs23 === errors;
																	} else var valid5 = true;
																}
															}
														}
													}
												} else {
													validate202.errors = [{
														instancePath: instancePath + "/runtime_defaults",
														schemaPath: "#/$defs/AgentPreferences/type",
														keyword: "type",
														params: { type: "object" },
														message: "must be object"
													}];
													return false;
												}
											}
											var valid0 = _errs15 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate202.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate202.errors = vErrors;
	return errors === 0;
}
validate202.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateGlobalConfigurationSaveResponse = validate209;
var schema285 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema289 = {
	"type": "string",
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	]
};
var schema291 = {
	"type": "string",
	"enum": ["off", "enabled"]
};
function validate213(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate213.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate213.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "temperature" || key0 === "top_p" || key0 === "max_output_tokens" || key0 === "input_budget" || key0 === "reasoning")) {
				validate213.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.temperature !== void 0) {
				let data0 = data.temperature;
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 2 || isNaN(data0)) {
						validate213.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 2
							},
							message: "must be <= 2"
						}];
						return false;
					} else if (data0 < 0 || isNaN(data0)) {
						validate213.errors = [{
							instancePath: instancePath + "/temperature",
							schemaPath: "#/properties/temperature/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: 0
							},
							message: "must be >= 0"
						}];
						return false;
					}
				} else {
					validate213.errors = [{
						instancePath: instancePath + "/temperature",
						schemaPath: "#/properties/temperature/type",
						keyword: "type",
						params: { type: "number" },
						message: "must be number"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.top_p !== void 0) {
					let data1 = data.top_p;
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 1 || isNaN(data1)) {
							validate213.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 1
								},
								message: "must be <= 1"
							}];
							return false;
						} else if (data1 < 0 || isNaN(data1)) {
							validate213.errors = [{
								instancePath: instancePath + "/top_p",
								schemaPath: "#/properties/top_p/minimum",
								keyword: "minimum",
								params: {
									comparison: ">=",
									limit: 0
								},
								message: "must be >= 0"
							}];
							return false;
						}
					} else {
						validate213.errors = [{
							instancePath: instancePath + "/top_p",
							schemaPath: "#/properties/top_p/type",
							keyword: "type",
							params: { type: "number" },
							message: "must be number"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.max_output_tokens !== void 0) {
						let data2 = data.max_output_tokens;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate213.errors = [{
								instancePath: instancePath + "/max_output_tokens",
								schemaPath: "#/properties/max_output_tokens/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 32768 || isNaN(data2)) {
								validate213.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 32768
									},
									message: "must be <= 32768"
								}];
								return false;
							} else if (data2 < 1 || isNaN(data2)) {
								validate213.errors = [{
									instancePath: instancePath + "/max_output_tokens",
									schemaPath: "#/properties/max_output_tokens/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 1
									},
									message: "must be >= 1"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.input_budget !== void 0) {
							let data3 = data.input_budget;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
								validate213.errors = [{
									instancePath: instancePath + "/input_budget",
									schemaPath: "#/properties/input_budget/type",
									keyword: "type",
									params: { type: "integer" },
									message: "must be integer"
								}];
								return false;
							}
							if (typeof data3 == "number" && isFinite(data3)) {
								if (data3 > 128e3 || isNaN(data3)) {
									validate213.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 128e3
										},
										message: "must be <= 128000"
									}];
									return false;
								} else if (data3 < 256 || isNaN(data3)) {
									validate213.errors = [{
										instancePath: instancePath + "/input_budget",
										schemaPath: "#/properties/input_budget/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: 256
										},
										message: "must be >= 256"
									}];
									return false;
								}
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.reasoning !== void 0) {
								let data4 = data.reasoning;
								if (typeof data4 !== "string") {
									validate213.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "off" || data4 === "enabled")) {
									validate213.errors = [{
										instancePath: instancePath + "/reasoning",
										schemaPath: "#/$defs/ReasoningMode/enum",
										keyword: "enum",
										params: { allowedValues: schema291.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate213.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate213.errors = vErrors;
	return true;
}
validate213.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate212(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate212.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters") || data.revision === void 0 && (missing0 = "revision") || data.credential_configured === void 0 && (missing0 = "credential_configured")) {
				validate212.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "protocol" || key0 === "base_url" || key0 === "model_name" || key0 === "parameters" || key0 === "revision" || key0 === "credential_configured")) {
					validate212.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.id !== void 0) {
						const _errs2 = errors;
						if (typeof data.id !== "string") {
							validate212.errors = [{
								instancePath: instancePath + "/id",
								schemaPath: "#/properties/id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.name !== void 0) {
							const _errs4 = errors;
							if (typeof data.name !== "string") {
								validate212.errors = [{
									instancePath: instancePath + "/name",
									schemaPath: "#/properties/name/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.protocol !== void 0) {
								let data2 = data.protocol;
								const _errs6 = errors;
								if (typeof data2 !== "string") {
									validate212.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data2 === "openai_chat_completions" || data2 === "anthropic_messages" || data2 === "openai_responses")) {
									validate212.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema289.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.base_url !== void 0) {
									const _errs9 = errors;
									if (typeof data.base_url !== "string") {
										validate212.errors = [{
											instancePath: instancePath + "/base_url",
											schemaPath: "#/properties/base_url/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.model_name !== void 0) {
										const _errs11 = errors;
										if (typeof data.model_name !== "string") {
											validate212.errors = [{
												instancePath: instancePath + "/model_name",
												schemaPath: "#/properties/model_name/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.parameters !== void 0) {
											const _errs13 = errors;
											if (!validate213(data.parameters, {
												instancePath: instancePath + "/parameters",
												parentData: data,
												parentDataProperty: "parameters",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate213.errors : vErrors.concat(validate213.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.revision !== void 0) {
												let data6 = data.revision;
												const _errs14 = errors;
												if (errors === errors) {
													if (typeof data6 === "string") {
														if (func2(data6) > 19) {
															validate212.errors = [{
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data6)) {
															validate212.errors = [{
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate212.errors = [{
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs14 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.credential_configured !== void 0) {
													const _errs17 = errors;
													if (typeof data.credential_configured !== "boolean") {
														validate212.errors = [{
															instancePath: instancePath + "/credential_configured",
															schemaPath: "#/properties/credential_configured/type",
															keyword: "type",
															params: { type: "boolean" },
															message: "must be boolean"
														}];
														return false;
													}
													var valid0 = _errs17 === errors;
												} else var valid0 = true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate212.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate212.errors = vErrors;
	return errors === 0;
}
validate212.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate216(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate216.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.language_style === void 0 && (missing0 = "language_style") || data.address_terms === void 0 && (missing0 = "address_terms") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.revision === void 0 && (missing0 = "revision")) {
			validate216.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "id" || key0 === "name" || key0 === "language_style" || key0 === "address_terms" || key0 === "skill" || key0 === "dimensions" || key0 === "revision")) {
				validate216.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.id !== void 0) {
				if (typeof data.id !== "string") {
					validate216.errors = [{
						instancePath: instancePath + "/id",
						schemaPath: "#/properties/id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.name !== void 0) {
					if (typeof data.name !== "string") {
						validate216.errors = [{
							instancePath: instancePath + "/name",
							schemaPath: "#/properties/name/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.language_style !== void 0) {
						if (typeof data.language_style !== "string") {
							validate216.errors = [{
								instancePath: instancePath + "/language_style",
								schemaPath: "#/properties/language_style/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.address_terms !== void 0) {
							let data3 = data.address_terms;
							if (Array.isArray(data3)) {
								const len0 = data3.length;
								for (let i0 = 0; i0 < len0; i0++) if (typeof data3[i0] !== "string") {
									validate216.errors = [{
										instancePath: instancePath + "/address_terms/" + i0,
										schemaPath: "#/properties/address_terms/items/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							} else {
								validate216.errors = [{
									instancePath: instancePath + "/address_terms",
									schemaPath: "#/properties/address_terms/type",
									keyword: "type",
									params: { type: "array" },
									message: "must be array"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.skill !== void 0) {
								if (typeof data.skill !== "string") {
									validate216.errors = [{
										instancePath: instancePath + "/skill",
										schemaPath: "#/properties/skill/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.dimensions !== void 0) {
									let data6 = data.dimensions;
									if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
										let missing1;
										if (data6.professional === void 0 && (missing1 = "professional") || data6.formal === void 0 && (missing1 = "formal") || data6.casual === void 0 && (missing1 = "casual") || data6.humor === void 0 && (missing1 = "humor") || data6.direct === void 0 && (missing1 = "direct") || data6.empathy === void 0 && (missing1 = "empathy") || data6.social_energy === void 0 && (missing1 = "social_energy")) {
											validate216.errors = [{
												instancePath: instancePath + "/dimensions",
												schemaPath: "#/$defs/PersonaDimensions/required",
												keyword: "required",
												params: { missingProperty: missing1 },
												message: "must have required property '" + missing1 + "'"
											}];
											return false;
										} else {
											for (const key1 in data6) if (!(key1 === "professional" || key1 === "formal" || key1 === "casual" || key1 === "humor" || key1 === "direct" || key1 === "empathy" || key1 === "social_energy")) {
												validate216.errors = [{
													instancePath: instancePath + "/dimensions",
													schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
													keyword: "additionalProperties",
													params: { additionalProperty: key1 },
													message: "must NOT have additional properties"
												}];
												return false;
											}
											if (data6.professional !== void 0) {
												let data7 = data6.professional;
												if (!(typeof data7 == "number" && !(data7 % 1) && !isNaN(data7) && isFinite(data7))) {
													validate216.errors = [{
														instancePath: instancePath + "/dimensions/professional",
														schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
														keyword: "type",
														params: { type: "integer" },
														message: "must be integer"
													}];
													return false;
												}
												if (typeof data7 == "number" && isFinite(data7)) {
													if (data7 > 100 || isNaN(data7)) {
														validate216.errors = [{
															instancePath: instancePath + "/dimensions/professional",
															schemaPath: "#/$defs/PersonaDimensions/properties/professional/maximum",
															keyword: "maximum",
															params: {
																comparison: "<=",
																limit: 100
															},
															message: "must be <= 100"
														}];
														return false;
													} else if (data7 < 0 || isNaN(data7)) {
														validate216.errors = [{
															instancePath: instancePath + "/dimensions/professional",
															schemaPath: "#/$defs/PersonaDimensions/properties/professional/minimum",
															keyword: "minimum",
															params: {
																comparison: ">=",
																limit: 0
															},
															message: "must be >= 0"
														}];
														return false;
													}
												}
												var valid3 = true;
											} else var valid3 = true;
											if (valid3) {
												if (data6.formal !== void 0) {
													let data8 = data6.formal;
													if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
														validate216.errors = [{
															instancePath: instancePath + "/dimensions/formal",
															schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
															keyword: "type",
															params: { type: "integer" },
															message: "must be integer"
														}];
														return false;
													}
													if (typeof data8 == "number" && isFinite(data8)) {
														if (data8 > 100 || isNaN(data8)) {
															validate216.errors = [{
																instancePath: instancePath + "/dimensions/formal",
																schemaPath: "#/$defs/PersonaDimensions/properties/formal/maximum",
																keyword: "maximum",
																params: {
																	comparison: "<=",
																	limit: 100
																},
																message: "must be <= 100"
															}];
															return false;
														} else if (data8 < 0 || isNaN(data8)) {
															validate216.errors = [{
																instancePath: instancePath + "/dimensions/formal",
																schemaPath: "#/$defs/PersonaDimensions/properties/formal/minimum",
																keyword: "minimum",
																params: {
																	comparison: ">=",
																	limit: 0
																},
																message: "must be >= 0"
															}];
															return false;
														}
													}
													var valid3 = true;
												} else var valid3 = true;
												if (valid3) {
													if (data6.casual !== void 0) {
														let data9 = data6.casual;
														if (!(typeof data9 == "number" && !(data9 % 1) && !isNaN(data9) && isFinite(data9))) {
															validate216.errors = [{
																instancePath: instancePath + "/dimensions/casual",
																schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (typeof data9 == "number" && isFinite(data9)) {
															if (data9 > 100 || isNaN(data9)) {
																validate216.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/maximum",
																	keyword: "maximum",
																	params: {
																		comparison: "<=",
																		limit: 100
																	},
																	message: "must be <= 100"
																}];
																return false;
															} else if (data9 < 0 || isNaN(data9)) {
																validate216.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/minimum",
																	keyword: "minimum",
																	params: {
																		comparison: ">=",
																		limit: 0
																	},
																	message: "must be >= 0"
																}];
																return false;
															}
														}
														var valid3 = true;
													} else var valid3 = true;
													if (valid3) {
														if (data6.humor !== void 0) {
															let data10 = data6.humor;
															if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																validate216.errors = [{
																	instancePath: instancePath + "/dimensions/humor",
																	schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																}];
																return false;
															}
															if (typeof data10 == "number" && isFinite(data10)) {
																if (data10 > 100 || isNaN(data10)) {
																	validate216.errors = [{
																		instancePath: instancePath + "/dimensions/humor",
																		schemaPath: "#/$defs/PersonaDimensions/properties/humor/maximum",
																		keyword: "maximum",
																		params: {
																			comparison: "<=",
																			limit: 100
																		},
																		message: "must be <= 100"
																	}];
																	return false;
																} else if (data10 < 0 || isNaN(data10)) {
																	validate216.errors = [{
																		instancePath: instancePath + "/dimensions/humor",
																		schemaPath: "#/$defs/PersonaDimensions/properties/humor/minimum",
																		keyword: "minimum",
																		params: {
																			comparison: ">=",
																			limit: 0
																		},
																		message: "must be >= 0"
																	}];
																	return false;
																}
															}
															var valid3 = true;
														} else var valid3 = true;
														if (valid3) {
															if (data6.direct !== void 0) {
																let data11 = data6.direct;
																if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																	validate216.errors = [{
																		instancePath: instancePath + "/dimensions/direct",
																		schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																		keyword: "type",
																		params: { type: "integer" },
																		message: "must be integer"
																	}];
																	return false;
																}
																if (typeof data11 == "number" && isFinite(data11)) {
																	if (data11 > 100 || isNaN(data11)) {
																		validate216.errors = [{
																			instancePath: instancePath + "/dimensions/direct",
																			schemaPath: "#/$defs/PersonaDimensions/properties/direct/maximum",
																			keyword: "maximum",
																			params: {
																				comparison: "<=",
																				limit: 100
																			},
																			message: "must be <= 100"
																		}];
																		return false;
																	} else if (data11 < 0 || isNaN(data11)) {
																		validate216.errors = [{
																			instancePath: instancePath + "/dimensions/direct",
																			schemaPath: "#/$defs/PersonaDimensions/properties/direct/minimum",
																			keyword: "minimum",
																			params: {
																				comparison: ">=",
																				limit: 0
																			},
																			message: "must be >= 0"
																		}];
																		return false;
																	}
																}
																var valid3 = true;
															} else var valid3 = true;
															if (valid3) {
																if (data6.empathy !== void 0) {
																	let data12 = data6.empathy;
																	if (!(typeof data12 == "number" && !(data12 % 1) && !isNaN(data12) && isFinite(data12))) {
																		validate216.errors = [{
																			instancePath: instancePath + "/dimensions/empathy",
																			schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																			keyword: "type",
																			params: { type: "integer" },
																			message: "must be integer"
																		}];
																		return false;
																	}
																	if (typeof data12 == "number" && isFinite(data12)) {
																		if (data12 > 100 || isNaN(data12)) {
																			validate216.errors = [{
																				instancePath: instancePath + "/dimensions/empathy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/empathy/maximum",
																				keyword: "maximum",
																				params: {
																					comparison: "<=",
																					limit: 100
																				},
																				message: "must be <= 100"
																			}];
																			return false;
																		} else if (data12 < 0 || isNaN(data12)) {
																			validate216.errors = [{
																				instancePath: instancePath + "/dimensions/empathy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/empathy/minimum",
																				keyword: "minimum",
																				params: {
																					comparison: ">=",
																					limit: 0
																				},
																				message: "must be >= 0"
																			}];
																			return false;
																		}
																	}
																	var valid3 = true;
																} else var valid3 = true;
																if (valid3) {
																	if (data6.social_energy !== void 0) {
																		let data13 = data6.social_energy;
																		if (!(typeof data13 == "number" && !(data13 % 1) && !isNaN(data13) && isFinite(data13))) {
																			validate216.errors = [{
																				instancePath: instancePath + "/dimensions/social_energy",
																				schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																				keyword: "type",
																				params: { type: "integer" },
																				message: "must be integer"
																			}];
																			return false;
																		}
																		if (typeof data13 == "number" && isFinite(data13)) {
																			if (data13 > 100 || isNaN(data13)) {
																				validate216.errors = [{
																					instancePath: instancePath + "/dimensions/social_energy",
																					schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/maximum",
																					keyword: "maximum",
																					params: {
																						comparison: "<=",
																						limit: 100
																					},
																					message: "must be <= 100"
																				}];
																				return false;
																			} else if (data13 < 0 || isNaN(data13)) {
																				validate216.errors = [{
																					instancePath: instancePath + "/dimensions/social_energy",
																					schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/minimum",
																					keyword: "minimum",
																					params: {
																						comparison: ">=",
																						limit: 0
																					},
																					message: "must be >= 0"
																				}];
																				return false;
																			}
																		}
																		var valid3 = true;
																	} else var valid3 = true;
																}
															}
														}
													}
												}
											}
										}
									} else {
										validate216.errors = [{
											instancePath: instancePath + "/dimensions",
											schemaPath: "#/$defs/PersonaDimensions/type",
											keyword: "type",
											params: { type: "object" },
											message: "must be object"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.revision !== void 0) {
										let data14 = data.revision;
										if (typeof data14 === "string") {
											if (func2(data14) > 19) {
												validate216.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												}];
												return false;
											} else if (!pattern4.test(data14)) {
												validate216.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												}];
												return false;
											}
										} else {
											validate216.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = true;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate216.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate216.errors = vErrors;
	return true;
}
validate216.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate211(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate211.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.revision === void 0 && (missing0 = "revision") || data.model_profiles === void 0 && (missing0 = "model_profiles") || data.persona_presets === void 0 && (missing0 = "persona_presets") || data.runtime_defaults === void 0 && (missing0 = "runtime_defaults")) {
				validate211.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "revision" || key0 === "model_profiles" || key0 === "persona_presets" || key0 === "runtime_defaults")) {
					validate211.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.revision !== void 0) {
						let data0 = data.revision;
						const _errs2 = errors;
						if (errors === errors) {
							if (typeof data0 === "string") {
								if (func2(data0) > 19) {
									validate211.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									}];
									return false;
								} else if (!pattern4.test(data0)) {
									validate211.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									}];
									return false;
								}
							} else {
								validate211.errors = [{
									instancePath: instancePath + "/revision",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.model_profiles !== void 0) {
							let data1 = data.model_profiles;
							const _errs5 = errors;
							if (errors === _errs5) {
								if (Array.isArray(data1)) {
									const len0 = data1.length;
									for (let i0 = 0; i0 < len0; i0++) {
										const _errs7 = errors;
										if (!validate212(data1[i0], {
											instancePath: instancePath + "/model_profiles/" + i0,
											parentData: data1,
											parentDataProperty: i0,
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate212.errors : vErrors.concat(validate212.errors);
											errors = vErrors.length;
										}
										if (!(_errs7 === errors)) break;
									}
								} else {
									validate211.errors = [{
										instancePath: instancePath + "/model_profiles",
										schemaPath: "#/properties/model_profiles/type",
										keyword: "type",
										params: { type: "array" },
										message: "must be array"
									}];
									return false;
								}
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.persona_presets !== void 0) {
								let data3 = data.persona_presets;
								const _errs8 = errors;
								if (errors === _errs8) {
									if (Array.isArray(data3)) {
										const len1 = data3.length;
										for (let i1 = 0; i1 < len1; i1++) {
											const _errs10 = errors;
											if (!validate216(data3[i1], {
												instancePath: instancePath + "/persona_presets/" + i1,
												parentData: data3,
												parentDataProperty: i1,
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate216.errors : vErrors.concat(validate216.errors);
												errors = vErrors.length;
											}
											if (!(_errs10 === errors)) break;
										}
									} else {
										validate211.errors = [{
											instancePath: instancePath + "/persona_presets",
											schemaPath: "#/properties/persona_presets/type",
											keyword: "type",
											params: { type: "array" },
											message: "must be array"
										}];
										return false;
									}
								}
								var valid0 = _errs8 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.runtime_defaults !== void 0) {
									let data5 = data.runtime_defaults;
									const _errs11 = errors;
									if (errors === errors) {
										if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
											let missing1;
											if (data5.request_limit_daily === void 0 && (missing1 = "request_limit_daily") || data5.persistent_memory === void 0 && (missing1 = "persistent_memory") || data5.allow_autonomous_wake === void 0 && (missing1 = "allow_autonomous_wake")) {
												validate211.errors = [{
													instancePath: instancePath + "/runtime_defaults",
													schemaPath: "#/$defs/AgentPreferences/required",
													keyword: "required",
													params: { missingProperty: missing1 },
													message: "must have required property '" + missing1 + "'"
												}];
												return false;
											} else {
												const _errs14 = errors;
												for (const key1 in data5) if (!(key1 === "request_limit_daily" || key1 === "persistent_memory" || key1 === "allow_autonomous_wake")) {
													validate211.errors = [{
														instancePath: instancePath + "/runtime_defaults",
														schemaPath: "#/$defs/AgentPreferences/additionalProperties",
														keyword: "additionalProperties",
														params: { additionalProperty: key1 },
														message: "must NOT have additional properties"
													}];
													return false;
												}
												if (_errs14 === errors) {
													if (data5.request_limit_daily !== void 0) {
														let data6 = data5.request_limit_daily;
														const _errs15 = errors;
														if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
															validate211.errors = [{
																instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (errors === _errs15) {
															if (typeof data6 == "number" && isFinite(data6)) {
																if (data6 > 5e3 || isNaN(data6)) {
																	validate211.errors = [{
																		instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																		schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/maximum",
																		keyword: "maximum",
																		params: {
																			comparison: "<=",
																			limit: 5e3
																		},
																		message: "must be <= 5000"
																	}];
																	return false;
																} else if (data6 < 1 || isNaN(data6)) {
																	validate211.errors = [{
																		instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																		schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/minimum",
																		keyword: "minimum",
																		params: {
																			comparison: ">=",
																			limit: 1
																		},
																		message: "must be >= 1"
																	}];
																	return false;
																}
															}
														}
														var valid5 = _errs15 === errors;
													} else var valid5 = true;
													if (valid5) {
														if (data5.persistent_memory !== void 0) {
															const _errs17 = errors;
															if (typeof data5.persistent_memory !== "boolean") {
																validate211.errors = [{
																	instancePath: instancePath + "/runtime_defaults/persistent_memory",
																	schemaPath: "#/$defs/AgentPreferences/properties/persistent_memory/type",
																	keyword: "type",
																	params: { type: "boolean" },
																	message: "must be boolean"
																}];
																return false;
															}
															var valid5 = _errs17 === errors;
														} else var valid5 = true;
														if (valid5) {
															if (data5.allow_autonomous_wake !== void 0) {
																const _errs19 = errors;
																if (typeof data5.allow_autonomous_wake !== "boolean") {
																	validate211.errors = [{
																		instancePath: instancePath + "/runtime_defaults/allow_autonomous_wake",
																		schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																		keyword: "type",
																		params: { type: "boolean" },
																		message: "must be boolean"
																	}];
																	return false;
																}
																var valid5 = _errs19 === errors;
															} else var valid5 = true;
														}
													}
												}
											}
										} else {
											validate211.errors = [{
												instancePath: instancePath + "/runtime_defaults",
												schemaPath: "#/$defs/AgentPreferences/type",
												keyword: "type",
												params: { type: "object" },
												message: "must be object"
											}];
											return false;
										}
									}
									var valid0 = _errs11 === errors;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		} else {
			validate211.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate211.errors = vErrors;
	return errors === 0;
}
validate211.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate210(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate210.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate210.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate210.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate210.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate210.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema285.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate211(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate211.errors : vErrors.concat(validate211.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate210.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate210.errors = vErrors;
	return errors === 0;
}
validate210.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema299 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema300 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema301 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate221(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate221.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate221.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate221.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate221.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate221.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema300.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate221.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate221.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate221.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema301.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate221.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema299.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate221.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate221.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate221.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate221.errors = vErrors;
	return true;
}
validate221.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate220(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate220.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate220.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate220.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate220.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate220.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema285.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate221(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate221.errors : vErrors.concat(validate221.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate220.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate220.errors = vErrors;
	return errors === 0;
}
validate220.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate209(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate209.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate210(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate210.errors : vErrors.concat(validate210.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate220(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate209.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate209.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate209.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateModelProfileTestRequest = validate224;
function validate224(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate224.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.profile_id === void 0 && (missing0 = "profile_id") || data.expected_revision === void 0 && (missing0 = "expected_revision")) {
			validate224.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "profile_id" || key0 === "expected_revision")) {
				validate224.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate224.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.profile_id !== void 0) {
					if (typeof data.profile_id !== "string") {
						validate224.errors = [{
							instancePath: instancePath + "/profile_id",
							schemaPath: "#/properties/profile_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.expected_revision !== void 0) {
						let data2 = data.expected_revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate224.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate224.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate224.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate224.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate224.errors = vErrors;
	return true;
}
validate224.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateModelProfileTestResponse = validate225;
var schema306 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema307 = {
	"type": "object",
	"properties": {
		"profile_id": { "type": "string" },
		"revision": { "$ref": "#/$defs/DecimalString" },
		"protocol": { "$ref": "#/$defs/ModelProtocol" },
		"available": { "type": "boolean" },
		"usage_input_tokens": {
			"type": ["integer", "null"],
			"format": "uint32",
			"minimum": 0
		},
		"usage_output_tokens": {
			"type": ["integer", "null"],
			"format": "uint32",
			"minimum": 0
		},
		"elapsed_ms": {
			"type": "integer",
			"format": "uint32",
			"minimum": 0
		}
	},
	"additionalProperties": false,
	"required": [
		"profile_id",
		"revision",
		"protocol",
		"available",
		"usage_input_tokens",
		"usage_output_tokens",
		"elapsed_ms"
	]
};
var schema309 = {
	"type": "string",
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	]
};
function validate227(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate227.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.profile_id === void 0 && (missing0 = "profile_id") || data.revision === void 0 && (missing0 = "revision") || data.protocol === void 0 && (missing0 = "protocol") || data.available === void 0 && (missing0 = "available") || data.usage_input_tokens === void 0 && (missing0 = "usage_input_tokens") || data.usage_output_tokens === void 0 && (missing0 = "usage_output_tokens") || data.elapsed_ms === void 0 && (missing0 = "elapsed_ms")) {
			validate227.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "profile_id" || key0 === "revision" || key0 === "protocol" || key0 === "available" || key0 === "usage_input_tokens" || key0 === "usage_output_tokens" || key0 === "elapsed_ms")) {
				validate227.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.profile_id !== void 0) {
				if (typeof data.profile_id !== "string") {
					validate227.errors = [{
						instancePath: instancePath + "/profile_id",
						schemaPath: "#/properties/profile_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.revision !== void 0) {
					let data1 = data.revision;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate227.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate227.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate227.errors = [{
							instancePath: instancePath + "/revision",
							schemaPath: "#/$defs/DecimalString/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.protocol !== void 0) {
						let data2 = data.protocol;
						if (typeof data2 !== "string") {
							validate227.errors = [{
								instancePath: instancePath + "/protocol",
								schemaPath: "#/$defs/ModelProtocol/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "openai_chat_completions" || data2 === "anthropic_messages" || data2 === "openai_responses")) {
							validate227.errors = [{
								instancePath: instancePath + "/protocol",
								schemaPath: "#/$defs/ModelProtocol/enum",
								keyword: "enum",
								params: { allowedValues: schema309.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.available !== void 0) {
							if (typeof data.available !== "boolean") {
								validate227.errors = [{
									instancePath: instancePath + "/available",
									schemaPath: "#/properties/available/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.usage_input_tokens !== void 0) {
								let data4 = data.usage_input_tokens;
								if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4)) && data4 !== null) {
									validate227.errors = [{
										instancePath: instancePath + "/usage_input_tokens",
										schemaPath: "#/properties/usage_input_tokens/type",
										keyword: "type",
										params: { type: schema307.properties.usage_input_tokens.type },
										message: "must be integer,null"
									}];
									return false;
								}
								if (typeof data4 == "number" && isFinite(data4)) {
									if (data4 < 0 || isNaN(data4)) {
										validate227.errors = [{
											instancePath: instancePath + "/usage_input_tokens",
											schemaPath: "#/properties/usage_input_tokens/minimum",
											keyword: "minimum",
											params: {
												comparison: ">=",
												limit: 0
											},
											message: "must be >= 0"
										}];
										return false;
									}
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.usage_output_tokens !== void 0) {
									let data5 = data.usage_output_tokens;
									if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5)) && data5 !== null) {
										validate227.errors = [{
											instancePath: instancePath + "/usage_output_tokens",
											schemaPath: "#/properties/usage_output_tokens/type",
											keyword: "type",
											params: { type: schema307.properties.usage_output_tokens.type },
											message: "must be integer,null"
										}];
										return false;
									}
									if (typeof data5 == "number" && isFinite(data5)) {
										if (data5 < 0 || isNaN(data5)) {
											validate227.errors = [{
												instancePath: instancePath + "/usage_output_tokens",
												schemaPath: "#/properties/usage_output_tokens/minimum",
												keyword: "minimum",
												params: {
													comparison: ">=",
													limit: 0
												},
												message: "must be >= 0"
											}];
											return false;
										}
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.elapsed_ms !== void 0) {
										let data6 = data.elapsed_ms;
										if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
											validate227.errors = [{
												instancePath: instancePath + "/elapsed_ms",
												schemaPath: "#/properties/elapsed_ms/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (typeof data6 == "number" && isFinite(data6)) {
											if (data6 < 0 || isNaN(data6)) {
												validate227.errors = [{
													instancePath: instancePath + "/elapsed_ms",
													schemaPath: "#/properties/elapsed_ms/minimum",
													keyword: "minimum",
													params: {
														comparison: ">=",
														limit: 0
													},
													message: "must be >= 0"
												}];
												return false;
											}
										}
										var valid0 = true;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate227.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate227.errors = vErrors;
	return true;
}
validate227.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate226(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate226.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate226.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate226.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate226.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate226.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema306.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate227(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate227.errors : vErrors.concat(validate227.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate226.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate226.errors = vErrors;
	return errors === 0;
}
validate226.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema312 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema313 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema314 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate231(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate231.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate231.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate231.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate231.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate231.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema313.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate231.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate231.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate231.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema314.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate231.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema312.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate231.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate231.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate231.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate231.errors = vErrors;
	return true;
}
validate231.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate230(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate230.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate230.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate230.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate230.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate230.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema306.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate231(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate231.errors : vErrors.concat(validate231.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate230.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate230.errors = vErrors;
	return errors === 0;
}
validate230.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate225(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate225.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate226(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate226.errors : vErrors.concat(validate226.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate230(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate230.errors : vErrors.concat(validate230.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate225.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate225.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate225.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateSecretDeleteRequest = validate234;
function validate234(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate234.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.profile_id === void 0 && (missing0 = "profile_id") || data.expected_revision === void 0 && (missing0 = "expected_revision")) {
			validate234.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "profile_id" || key0 === "expected_revision")) {
				validate234.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate234.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.profile_id !== void 0) {
					if (typeof data.profile_id !== "string") {
						validate234.errors = [{
							instancePath: instancePath + "/profile_id",
							schemaPath: "#/properties/profile_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.expected_revision !== void 0) {
						let data2 = data.expected_revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate234.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate234.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate234.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate234.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate234.errors = vErrors;
	return true;
}
validate234.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateSecretDeleteResponse = validate235;
var schema319 = {
	"type": "string",
	"enum": ["0.3"]
};
function validate236(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate236.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate236.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
				validate236.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.schema_version !== void 0) {
				let data0 = data.schema_version;
				if (typeof data0 !== "string") {
					validate236.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "0.3")) {
					validate236.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/enum",
						keyword: "enum",
						params: { allowedValues: schema319.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data !== void 0) {
					let data1 = data.data;
					if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
						let missing1;
						if (data1.profile_id === void 0 && (missing1 = "profile_id") || data1.configured === void 0 && (missing1 = "configured")) {
							validate236.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/SecretStatus/required",
								keyword: "required",
								params: { missingProperty: missing1 },
								message: "must have required property '" + missing1 + "'"
							}];
							return false;
						} else {
							for (const key1 in data1) if (!(key1 === "profile_id" || key1 === "configured")) {
								validate236.errors = [{
									instancePath: instancePath + "/data",
									schemaPath: "#/$defs/SecretStatus/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key1 },
									message: "must NOT have additional properties"
								}];
								return false;
							}
							if (data1.profile_id !== void 0) {
								if (typeof data1.profile_id !== "string") {
									validate236.errors = [{
										instancePath: instancePath + "/data/profile_id",
										schemaPath: "#/$defs/SecretStatus/properties/profile_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid3 = true;
							} else var valid3 = true;
							if (valid3) {
								if (data1.configured !== void 0) {
									if (typeof data1.configured !== "boolean") {
										validate236.errors = [{
											instancePath: instancePath + "/data/configured",
											schemaPath: "#/$defs/SecretStatus/properties/configured/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid3 = true;
								} else var valid3 = true;
							}
						}
					} else {
						validate236.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/SecretStatus/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate236.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate236.errors = vErrors;
	return true;
}
validate236.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema323 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema324 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema325 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate239(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate239.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate239.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate239.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate239.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate239.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema324.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate239.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate239.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate239.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema325.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate239.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema323.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate239.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate239.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate239.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate239.errors = vErrors;
	return true;
}
validate239.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate238(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate238.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate238.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate238.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate238.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate238.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema319.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate239(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate239.errors : vErrors.concat(validate239.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate238.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate238.errors = vErrors;
	return errors === 0;
}
validate238.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate235(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate235.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate236(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate236.errors : vErrors.concat(validate236.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate238(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate238.errors : vErrors.concat(validate238.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate235.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate235.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate235.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateSecretSetRequest = validate242;
function validate242(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate242.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.profile_id === void 0 && (missing0 = "profile_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.api_key === void 0 && (missing0 = "api_key")) {
			validate242.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "profile_id" || key0 === "expected_revision" || key0 === "api_key")) {
				validate242.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate242.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.profile_id !== void 0) {
					if (typeof data.profile_id !== "string") {
						validate242.errors = [{
							instancePath: instancePath + "/profile_id",
							schemaPath: "#/properties/profile_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.expected_revision !== void 0) {
						let data2 = data.expected_revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate242.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate242.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate242.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.api_key !== void 0) {
							if (typeof data.api_key !== "string") {
								validate242.errors = [{
									instancePath: instancePath + "/api_key",
									schemaPath: "#/properties/api_key/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
					}
				}
			}
		}
	} else {
		validate242.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate242.errors = vErrors;
	return true;
}
validate242.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateSecretSetResponse = validate243;
var schema330 = {
	"type": "string",
	"enum": ["0.3"]
};
function validate244(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate244.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate244.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
				validate244.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.schema_version !== void 0) {
				let data0 = data.schema_version;
				if (typeof data0 !== "string") {
					validate244.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "0.3")) {
					validate244.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/enum",
						keyword: "enum",
						params: { allowedValues: schema330.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data !== void 0) {
					let data1 = data.data;
					if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
						let missing1;
						if (data1.profile_id === void 0 && (missing1 = "profile_id") || data1.configured === void 0 && (missing1 = "configured")) {
							validate244.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/SecretStatus/required",
								keyword: "required",
								params: { missingProperty: missing1 },
								message: "must have required property '" + missing1 + "'"
							}];
							return false;
						} else {
							for (const key1 in data1) if (!(key1 === "profile_id" || key1 === "configured")) {
								validate244.errors = [{
									instancePath: instancePath + "/data",
									schemaPath: "#/$defs/SecretStatus/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key1 },
									message: "must NOT have additional properties"
								}];
								return false;
							}
							if (data1.profile_id !== void 0) {
								if (typeof data1.profile_id !== "string") {
									validate244.errors = [{
										instancePath: instancePath + "/data/profile_id",
										schemaPath: "#/$defs/SecretStatus/properties/profile_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid3 = true;
							} else var valid3 = true;
							if (valid3) {
								if (data1.configured !== void 0) {
									if (typeof data1.configured !== "boolean") {
										validate244.errors = [{
											instancePath: instancePath + "/data/configured",
											schemaPath: "#/$defs/SecretStatus/properties/configured/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid3 = true;
								} else var valid3 = true;
							}
						}
					} else {
						validate244.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/SecretStatus/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate244.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate244.errors = vErrors;
	return true;
}
validate244.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema334 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema335 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema336 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate247(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate247.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate247.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate247.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate247.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate247.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema335.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate247.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate247.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate247.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema336.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate247.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema334.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate247.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate247.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate247.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate247.errors = vErrors;
	return true;
}
validate247.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate246(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate246.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate246.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate246.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate246.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate246.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema330.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate247(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate247.errors : vErrors.concat(validate247.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate246.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate246.errors = vErrors;
	return errors === 0;
}
validate246.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate243(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate243.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate244(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate244.errors : vErrors.concat(validate244.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate246(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate246.errors : vErrors.concat(validate246.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate243.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate243.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate243.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateSecretStatusRequest = validate250;
function validate250(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate250.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.profile_id === void 0 && (missing0 = "profile_id") || data.expected_revision === void 0 && (missing0 = "expected_revision")) {
			validate250.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "profile_id" || key0 === "expected_revision")) {
				validate250.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate250.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.profile_id !== void 0) {
					if (typeof data.profile_id !== "string") {
						validate250.errors = [{
							instancePath: instancePath + "/profile_id",
							schemaPath: "#/properties/profile_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.expected_revision !== void 0) {
						let data2 = data.expected_revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate250.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate250.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate250.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate250.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate250.errors = vErrors;
	return true;
}
validate250.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateSecretStatusResponse = validate251;
var schema341 = {
	"type": "string",
	"enum": ["0.3"]
};
function validate252(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate252.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate252.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
				validate252.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.schema_version !== void 0) {
				let data0 = data.schema_version;
				if (typeof data0 !== "string") {
					validate252.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "0.3")) {
					validate252.errors = [{
						instancePath: instancePath + "/schema_version",
						schemaPath: "#/$defs/SchemaVersion/enum",
						keyword: "enum",
						params: { allowedValues: schema341.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data !== void 0) {
					let data1 = data.data;
					if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
						let missing1;
						if (data1.profile_id === void 0 && (missing1 = "profile_id") || data1.configured === void 0 && (missing1 = "configured")) {
							validate252.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/SecretStatus/required",
								keyword: "required",
								params: { missingProperty: missing1 },
								message: "must have required property '" + missing1 + "'"
							}];
							return false;
						} else {
							for (const key1 in data1) if (!(key1 === "profile_id" || key1 === "configured")) {
								validate252.errors = [{
									instancePath: instancePath + "/data",
									schemaPath: "#/$defs/SecretStatus/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key1 },
									message: "must NOT have additional properties"
								}];
								return false;
							}
							if (data1.profile_id !== void 0) {
								if (typeof data1.profile_id !== "string") {
									validate252.errors = [{
										instancePath: instancePath + "/data/profile_id",
										schemaPath: "#/$defs/SecretStatus/properties/profile_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid3 = true;
							} else var valid3 = true;
							if (valid3) {
								if (data1.configured !== void 0) {
									if (typeof data1.configured !== "boolean") {
										validate252.errors = [{
											instancePath: instancePath + "/data/configured",
											schemaPath: "#/$defs/SecretStatus/properties/configured/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid3 = true;
								} else var valid3 = true;
							}
						}
					} else {
						validate252.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/SecretStatus/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate252.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate252.errors = vErrors;
	return true;
}
validate252.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema345 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema346 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema347 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate255(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate255.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate255.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate255.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate255.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate255.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema346.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate255.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate255.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate255.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema347.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate255.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema345.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate255.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate255.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate255.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate255.errors = vErrors;
	return true;
}
validate255.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate254(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate254.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate254.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate254.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate254.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate254.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema341.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate255(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate255.errors : vErrors.concat(validate255.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate254.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate254.errors = vErrors;
	return errors === 0;
}
validate254.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate251(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate251.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate252(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate252.errors : vErrors.concat(validate252.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate254(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate254.errors : vErrors.concat(validate254.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate251.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate251.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate251.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateUserProfileGetRequest = validate258;
function validate258(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate258.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id")) {
			validate258.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id")) {
				validate258.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate258.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
			}
		}
	} else {
		validate258.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate258.errors = vErrors;
	return true;
}
validate258.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateUserProfileGetResponse = validate259;
var schema351 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema352 = {
	"type": "object",
	"properties": {
		"participant_id": { "type": "string" },
		"display_name": { "type": "string" },
		"introduction": { "type": "string" },
		"avatar_id": { "type": ["string", "null"] },
		"revision": { "$ref": "#/$defs/DecimalString" }
	},
	"additionalProperties": false,
	"required": [
		"participant_id",
		"display_name",
		"introduction",
		"avatar_id",
		"revision"
	]
};
function validate261(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate261.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.participant_id === void 0 && (missing0 = "participant_id") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.revision === void 0 && (missing0 = "revision")) {
			validate261.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "participant_id" || key0 === "display_name" || key0 === "introduction" || key0 === "avatar_id" || key0 === "revision")) {
				validate261.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.participant_id !== void 0) {
				if (typeof data.participant_id !== "string") {
					validate261.errors = [{
						instancePath: instancePath + "/participant_id",
						schemaPath: "#/properties/participant_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.display_name !== void 0) {
					if (typeof data.display_name !== "string") {
						validate261.errors = [{
							instancePath: instancePath + "/display_name",
							schemaPath: "#/properties/display_name/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.introduction !== void 0) {
						if (typeof data.introduction !== "string") {
							validate261.errors = [{
								instancePath: instancePath + "/introduction",
								schemaPath: "#/properties/introduction/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.avatar_id !== void 0) {
							let data3 = data.avatar_id;
							if (typeof data3 !== "string" && data3 !== null) {
								validate261.errors = [{
									instancePath: instancePath + "/avatar_id",
									schemaPath: "#/properties/avatar_id/type",
									keyword: "type",
									params: { type: schema352.properties.avatar_id.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.revision !== void 0) {
								let data4 = data.revision;
								if (typeof data4 === "string") {
									if (func2(data4) > 19) {
										validate261.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data4)) {
										validate261.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate261.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate261.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate261.errors = vErrors;
	return true;
}
validate261.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate260(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate260.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate260.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate260.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate260.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate260.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema351.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate261(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate261.errors : vErrors.concat(validate261.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate260.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate260.errors = vErrors;
	return errors === 0;
}
validate260.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema356 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema357 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema358 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate265(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate265.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate265.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate265.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate265.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate265.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema357.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate265.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate265.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate265.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema358.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate265.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema356.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate265.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate265.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate265.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate265.errors = vErrors;
	return true;
}
validate265.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate264(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate264.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate264.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate264.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate264.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate264.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema351.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate265(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate265.errors : vErrors.concat(validate265.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate264.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate264.errors = vErrors;
	return errors === 0;
}
validate264.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate259(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate259.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate260(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate260.errors : vErrors.concat(validate260.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate264(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate264.errors : vErrors.concat(validate264.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate259.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate259.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate259.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateUserProfileSaveRequest = validate268;
var schema359 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"title": "UserProfileSaveRequest",
	"type": "object",
	"properties": {
		"data_generation_id": { "type": "string" },
		"client_request_id": { "type": "string" },
		"expected_revision": { "$ref": "#/$defs/DecimalString" },
		"display_name": { "type": "string" },
		"introduction": { "type": "string" },
		"avatar_id": { "type": ["string", "null"] }
	},
	"additionalProperties": false,
	"required": [
		"data_generation_id",
		"client_request_id",
		"expected_revision",
		"display_name",
		"introduction"
	],
	"$defs": { "DecimalString": {
		"type": "string",
		"maxLength": 19,
		"pattern": "^(0|[1-9][0-9]*)$"
	} }
};
function validate268(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate268.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction")) {
			validate268.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "client_request_id" || key0 === "expected_revision" || key0 === "display_name" || key0 === "introduction" || key0 === "avatar_id")) {
				validate268.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate268.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.client_request_id !== void 0) {
					if (typeof data.client_request_id !== "string") {
						validate268.errors = [{
							instancePath: instancePath + "/client_request_id",
							schemaPath: "#/properties/client_request_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.expected_revision !== void 0) {
						let data2 = data.expected_revision;
						if (typeof data2 === "string") {
							if (func2(data2) > 19) {
								validate268.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate268.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate268.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.display_name !== void 0) {
							if (typeof data.display_name !== "string") {
								validate268.errors = [{
									instancePath: instancePath + "/display_name",
									schemaPath: "#/properties/display_name/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.introduction !== void 0) {
								if (typeof data.introduction !== "string") {
									validate268.errors = [{
										instancePath: instancePath + "/introduction",
										schemaPath: "#/properties/introduction/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.avatar_id !== void 0) {
									let data5 = data.avatar_id;
									if (typeof data5 !== "string" && data5 !== null) {
										validate268.errors = [{
											instancePath: instancePath + "/avatar_id",
											schemaPath: "#/properties/avatar_id/type",
											keyword: "type",
											params: { type: schema359.properties.avatar_id.type },
											message: "must be string,null"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate268.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate268.errors = vErrors;
	return true;
}
validate268.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateUserProfileSaveResponse = validate269;
var schema363 = {
	"type": "string",
	"enum": ["0.3"]
};
var schema364 = {
	"type": "object",
	"properties": {
		"participant_id": { "type": "string" },
		"display_name": { "type": "string" },
		"introduction": { "type": "string" },
		"avatar_id": { "type": ["string", "null"] },
		"revision": { "$ref": "#/$defs/DecimalString" }
	},
	"additionalProperties": false,
	"required": [
		"participant_id",
		"display_name",
		"introduction",
		"avatar_id",
		"revision"
	]
};
function validate271(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate271.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.participant_id === void 0 && (missing0 = "participant_id") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.revision === void 0 && (missing0 = "revision")) {
			validate271.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "participant_id" || key0 === "display_name" || key0 === "introduction" || key0 === "avatar_id" || key0 === "revision")) {
				validate271.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.participant_id !== void 0) {
				if (typeof data.participant_id !== "string") {
					validate271.errors = [{
						instancePath: instancePath + "/participant_id",
						schemaPath: "#/properties/participant_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.display_name !== void 0) {
					if (typeof data.display_name !== "string") {
						validate271.errors = [{
							instancePath: instancePath + "/display_name",
							schemaPath: "#/properties/display_name/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.introduction !== void 0) {
						if (typeof data.introduction !== "string") {
							validate271.errors = [{
								instancePath: instancePath + "/introduction",
								schemaPath: "#/properties/introduction/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.avatar_id !== void 0) {
							let data3 = data.avatar_id;
							if (typeof data3 !== "string" && data3 !== null) {
								validate271.errors = [{
									instancePath: instancePath + "/avatar_id",
									schemaPath: "#/properties/avatar_id/type",
									keyword: "type",
									params: { type: schema364.properties.avatar_id.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.revision !== void 0) {
								let data4 = data.revision;
								if (typeof data4 === "string") {
									if (func2(data4) > 19) {
										validate271.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data4)) {
										validate271.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate271.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate271.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate271.errors = vErrors;
	return true;
}
validate271.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate270(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate270.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate270.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "data")) {
					validate270.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate270.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate270.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema363.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data !== void 0) {
							const _errs5 = errors;
							if (!validate271(data.data, {
								instancePath: instancePath + "/data",
								parentData: data,
								parentDataProperty: "data",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate271.errors : vErrors.concat(validate271.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate270.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate270.errors = vErrors;
	return errors === 0;
}
validate270.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema368 = {
	"type": "object",
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"field_path": { "type": ["string", "null"] },
		"trace_id": { "type": "string" },
		"may_have_been_charged": { "type": "boolean" }
	},
	"additionalProperties": false,
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	]
};
var schema369 = {
	"type": "string",
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	]
};
var schema370 = {
	"type": "string",
	"enum": [
		"never",
		"retry",
		"after_user_action"
	]
};
function validate275(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate275.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate275.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "message" || key0 === "retryability" || key0 === "field_path" || key0 === "trace_id" || key0 === "may_have_been_charged")) {
				validate275.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate275.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate275.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema369.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message !== void 0) {
					if (typeof data.message !== "string") {
						validate275.errors = [{
							instancePath: instancePath + "/message",
							schemaPath: "#/properties/message/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.retryability !== void 0) {
						let data2 = data.retryability;
						if (typeof data2 !== "string") {
							validate275.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "never" || data2 === "retry" || data2 === "after_user_action")) {
							validate275.errors = [{
								instancePath: instancePath + "/retryability",
								schemaPath: "#/$defs/Retryability/enum",
								keyword: "enum",
								params: { allowedValues: schema370.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data3 = data.field_path;
							if (typeof data3 !== "string" && data3 !== null) {
								validate275.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema368.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.trace_id !== void 0) {
								if (typeof data.trace_id !== "string") {
									validate275.errors = [{
										instancePath: instancePath + "/trace_id",
										schemaPath: "#/properties/trace_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.may_have_been_charged !== void 0) {
									if (typeof data.may_have_been_charged !== "boolean") {
										validate275.errors = [{
											instancePath: instancePath + "/may_have_been_charged",
											schemaPath: "#/properties/may_have_been_charged/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate275.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate275.errors = vErrors;
	return true;
}
validate275.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate274(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate274.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate274.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "schema_version" || key0 === "error")) {
					validate274.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.schema_version !== void 0) {
						let data0 = data.schema_version;
						const _errs2 = errors;
						if (typeof data0 !== "string") {
							validate274.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data0 === "0.3")) {
							validate274.errors = [{
								instancePath: instancePath + "/schema_version",
								schemaPath: "#/$defs/SchemaVersion/enum",
								keyword: "enum",
								params: { allowedValues: schema363.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.error !== void 0) {
							const _errs5 = errors;
							if (!validate275(data.error, {
								instancePath: instancePath + "/error",
								parentData: data,
								parentDataProperty: "error",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate275.errors : vErrors.concat(validate275.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate274.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate274.errors = vErrors;
	return errors === 0;
}
validate274.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate269(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate269.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate270(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate270.errors : vErrors.concat(validate270.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate274(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate274.errors : vErrors.concat(validate274.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate269.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate269.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate269.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateAgentListRequest, validateAgentListResponse, validateAgentSaveRequest, validateAgentSaveResponse, validateAppSnapshotRequest, validateAppSnapshotResponse, validateAppearanceSaveRequest, validateAppearanceSaveResponse, validateAvatarImportRequest, validateAvatarImportResponse, validateAvatarReadRequest, validateAvatarReadResponse, validateCancelSearchRequest, validateCancelSearchResponse, validateChatListRequest, validateChatListResponse, validateChatSearchRequest, validateChatSearchResponse, validateChatSendRequest, validateChatSendResponse, validateDevelopmentModelImportRequest, validateDevelopmentModelImportResponse, validateDomainEvent, validateExitRequest, validateExitResponse, validateGlobalConfigurationGetRequest, validateGlobalConfigurationGetResponse, validateGlobalConfigurationSaveRequest, validateGlobalConfigurationSaveResponse, validateModelProfileTestRequest, validateModelProfileTestResponse, validateSecretDeleteRequest, validateSecretDeleteResponse, validateSecretSetRequest, validateSecretSetResponse, validateSecretStatusRequest, validateSecretStatusResponse, validateUserProfileGetRequest, validateUserProfileGetResponse, validateUserProfileSaveRequest, validateUserProfileSaveResponse };
