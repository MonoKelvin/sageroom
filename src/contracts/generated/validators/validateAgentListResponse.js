import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateAgentListResponse.js
var validateAgentListResponse = validate21;
var schema45 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema34 = {
	"additionalProperties": false,
	"properties": {
		"address_terms": {
			"items": { "type": "string" },
			"type": "array"
		},
		"agent_id": { "type": "string" },
		"agent_type": { "$ref": "#/$defs/AgentType" },
		"avatar_id": { "type": ["string", "null"] },
		"dimensions": { "$ref": "#/$defs/PersonaDimensions" },
		"display_name": { "type": "string" },
		"gender_description": { "type": ["string", "null"] },
		"introduction": { "type": "string" },
		"language_style": { "type": "string" },
		"model": { "anyOf": [{ "$ref": "#/$defs/AgentModelSnapshot" }, { "type": "null" }] },
		"preferences": { "$ref": "#/$defs/AgentPreferences" },
		"revision": { "$ref": "#/$defs/DecimalString" },
		"skill": { "type": "string" }
	},
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
	],
	"type": "object"
};
var schema35 = {
	"enum": ["social", "tool"],
	"type": "string"
};
var func1 = Object.prototype.hasOwnProperty;
var func2 = require_ucs2length().default;
var schema41 = {
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	],
	"type": "string"
};
var schema40 = {
	"enum": ["off", "enabled"],
	"type": "string"
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
			for (const key0 in data) if (!(key0 === "input_budget" || key0 === "max_output_tokens" || key0 === "reasoning" || key0 === "temperature" || key0 === "top_p")) {
				validate26.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.input_budget !== void 0) {
				let data0 = data.input_budget;
				if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0) && isFinite(data0))) {
					validate26.errors = [{
						instancePath: instancePath + "/input_budget",
						schemaPath: "#/properties/input_budget/type",
						keyword: "type",
						params: { type: "integer" },
						message: "must be integer"
					}];
					return false;
				}
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 128e3 || isNaN(data0)) {
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
					} else if (data0 < 256 || isNaN(data0)) {
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
				if (data.max_output_tokens !== void 0) {
					let data1 = data.max_output_tokens;
					if (!(typeof data1 == "number" && !(data1 % 1) && !isNaN(data1) && isFinite(data1))) {
						validate26.errors = [{
							instancePath: instancePath + "/max_output_tokens",
							schemaPath: "#/properties/max_output_tokens/type",
							keyword: "type",
							params: { type: "integer" },
							message: "must be integer"
						}];
						return false;
					}
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 32768 || isNaN(data1)) {
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
						} else if (data1 < 1 || isNaN(data1)) {
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
					if (data.reasoning !== void 0) {
						let data2 = data.reasoning;
						if (typeof data2 !== "string") {
							validate26.errors = [{
								instancePath: instancePath + "/reasoning",
								schemaPath: "#/$defs/ReasoningMode/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "off" || data2 === "enabled")) {
							validate26.errors = [{
								instancePath: instancePath + "/reasoning",
								schemaPath: "#/$defs/ReasoningMode/enum",
								keyword: "enum",
								params: { allowedValues: schema40.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.temperature !== void 0) {
							let data3 = data.temperature;
							if (typeof data3 == "number" && isFinite(data3)) {
								if (data3 > 2 || isNaN(data3)) {
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
								} else if (data3 < 0 || isNaN(data3)) {
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
								let data4 = data.top_p;
								if (typeof data4 == "number" && isFinite(data4)) {
									if (data4 > 1 || isNaN(data4)) {
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
									} else if (data4 < 0 || isNaN(data4)) {
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
				for (const key0 in data) if (!(key0 === "base_url" || key0 === "id" || key0 === "model_name" || key0 === "name" || key0 === "parameters" || key0 === "protocol")) {
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
					if (data.base_url !== void 0) {
						let data0 = data.base_url;
						const _errs2 = errors;
						if (errors === _errs2) {
							if (typeof data0 === "string") {
								if (func2(data0) > 2048) {
									validate25.errors = [{
										instancePath: instancePath + "/base_url",
										schemaPath: "#/properties/base_url/maxLength",
										keyword: "maxLength",
										params: { limit: 2048 },
										message: "must NOT have more than 2048 characters"
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
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.id !== void 0) {
							const _errs4 = errors;
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
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.model_name !== void 0) {
								let data2 = data.model_name;
								const _errs6 = errors;
								if (errors === _errs6) {
									if (typeof data2 === "string") {
										if (func2(data2) > 200) {
											validate25.errors = [{
												instancePath: instancePath + "/model_name",
												schemaPath: "#/properties/model_name/maxLength",
												keyword: "maxLength",
												params: { limit: 200 },
												message: "must NOT have more than 200 characters"
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
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.name !== void 0) {
									let data3 = data.name;
									const _errs8 = errors;
									if (errors === _errs8) {
										if (typeof data3 === "string") {
											if (func2(data3) > 80) {
												validate25.errors = [{
													instancePath: instancePath + "/name",
													schemaPath: "#/properties/name/maxLength",
													keyword: "maxLength",
													params: { limit: 80 },
													message: "must NOT have more than 80 characters"
												}];
												return false;
											} else if (func2(data3) < 1) {
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
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.parameters !== void 0) {
										const _errs10 = errors;
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
										var valid0 = _errs10 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.protocol !== void 0) {
											let data5 = data.protocol;
											const _errs11 = errors;
											if (typeof data5 !== "string") {
												validate25.errors = [{
													instancePath: instancePath + "/protocol",
													schemaPath: "#/$defs/ModelProtocol/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											if (!(data5 === "openai_chat_completions" || data5 === "anthropic_messages" || data5 === "openai_responses")) {
												validate25.errors = [{
													instancePath: instancePath + "/protocol",
													schemaPath: "#/$defs/ModelProtocol/enum",
													keyword: "enum",
													params: { allowedValues: schema41.enum },
													message: "must be equal to one of the allowed values"
												}];
												return false;
											}
											var valid0 = _errs11 === errors;
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
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
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
				for (const key0 in data) if (!(key0 === "profile" || key0 === "source_profile_id" || key0 === "source_profile_revision")) {
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
					if (data.profile !== void 0) {
						const _errs2 = errors;
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
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.source_profile_id !== void 0) {
							const _errs3 = errors;
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
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.source_profile_revision !== void 0) {
								let data2 = data.source_profile_revision;
								const _errs5 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											validate24.errors = [{
												instancePath: instancePath + "/source_profile_revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
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
								var valid0 = _errs5 === errors;
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
				for (const key0 in data) if (!func1.call(schema34.properties, key0)) {
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
					if (data.address_terms !== void 0) {
						let data0 = data.address_terms;
						const _errs2 = errors;
						if (errors === _errs2) {
							if (Array.isArray(data0)) {
								const len0 = data0.length;
								for (let i0 = 0; i0 < len0; i0++) {
									const _errs4 = errors;
									if (typeof data0[i0] !== "string") {
										validate23.errors = [{
											instancePath: instancePath + "/address_terms/" + i0,
											schemaPath: "#/properties/address_terms/items/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									if (!(_errs4 === errors)) break;
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
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.agent_id !== void 0) {
							const _errs6 = errors;
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
							var valid0 = _errs6 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.agent_type !== void 0) {
								let data3 = data.agent_type;
								const _errs8 = errors;
								if (typeof data3 !== "string") {
									validate23.errors = [{
										instancePath: instancePath + "/agent_type",
										schemaPath: "#/$defs/AgentType/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data3 === "social" || data3 === "tool")) {
									validate23.errors = [{
										instancePath: instancePath + "/agent_type",
										schemaPath: "#/$defs/AgentType/enum",
										keyword: "enum",
										params: { allowedValues: schema35.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs8 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.avatar_id !== void 0) {
									let data4 = data.avatar_id;
									const _errs11 = errors;
									if (typeof data4 !== "string" && data4 !== null) {
										validate23.errors = [{
											instancePath: instancePath + "/avatar_id",
											schemaPath: "#/properties/avatar_id/type",
											keyword: "type",
											params: { type: schema34.properties.avatar_id.type },
											message: "must be string,null"
										}];
										return false;
									}
									var valid0 = _errs11 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.dimensions !== void 0) {
										let data5 = data.dimensions;
										const _errs13 = errors;
										if (errors === errors) {
											if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
												let missing1;
												if (data5.professional === void 0 && (missing1 = "professional") || data5.formal === void 0 && (missing1 = "formal") || data5.casual === void 0 && (missing1 = "casual") || data5.humor === void 0 && (missing1 = "humor") || data5.direct === void 0 && (missing1 = "direct") || data5.empathy === void 0 && (missing1 = "empathy") || data5.social_energy === void 0 && (missing1 = "social_energy")) {
													validate23.errors = [{
														instancePath: instancePath + "/dimensions",
														schemaPath: "#/$defs/PersonaDimensions/required",
														keyword: "required",
														params: { missingProperty: missing1 },
														message: "must have required property '" + missing1 + "'"
													}];
													return false;
												} else {
													const _errs16 = errors;
													for (const key1 in data5) if (!(key1 === "casual" || key1 === "direct" || key1 === "empathy" || key1 === "formal" || key1 === "humor" || key1 === "professional" || key1 === "social_energy")) {
														validate23.errors = [{
															instancePath: instancePath + "/dimensions",
															schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
															keyword: "additionalProperties",
															params: { additionalProperty: key1 },
															message: "must NOT have additional properties"
														}];
														return false;
													}
													if (_errs16 === errors) {
														if (data5.casual !== void 0) {
															let data6 = data5.casual;
															const _errs17 = errors;
															if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
																validate23.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																}];
																return false;
															}
															if (errors === _errs17) {
																if (typeof data6 == "number" && isFinite(data6)) {
																	if (data6 > 100 || isNaN(data6)) {
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
																	} else if (data6 < 0 || isNaN(data6)) {
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
															var valid4 = _errs17 === errors;
														} else var valid4 = true;
														if (valid4) {
															if (data5.direct !== void 0) {
																let data7 = data5.direct;
																const _errs19 = errors;
																if (!(typeof data7 == "number" && !(data7 % 1) && !isNaN(data7) && isFinite(data7))) {
																	validate23.errors = [{
																		instancePath: instancePath + "/dimensions/direct",
																		schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																		keyword: "type",
																		params: { type: "integer" },
																		message: "must be integer"
																	}];
																	return false;
																}
																if (errors === _errs19) {
																	if (typeof data7 == "number" && isFinite(data7)) {
																		if (data7 > 100 || isNaN(data7)) {
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
																		} else if (data7 < 0 || isNaN(data7)) {
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
																var valid4 = _errs19 === errors;
															} else var valid4 = true;
															if (valid4) {
																if (data5.empathy !== void 0) {
																	let data8 = data5.empathy;
																	const _errs21 = errors;
																	if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
																		validate23.errors = [{
																			instancePath: instancePath + "/dimensions/empathy",
																			schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																			keyword: "type",
																			params: { type: "integer" },
																			message: "must be integer"
																		}];
																		return false;
																	}
																	if (errors === _errs21) {
																		if (typeof data8 == "number" && isFinite(data8)) {
																			if (data8 > 100 || isNaN(data8)) {
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
																			} else if (data8 < 0 || isNaN(data8)) {
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
																	var valid4 = _errs21 === errors;
																} else var valid4 = true;
																if (valid4) {
																	if (data5.formal !== void 0) {
																		let data9 = data5.formal;
																		const _errs23 = errors;
																		if (!(typeof data9 == "number" && !(data9 % 1) && !isNaN(data9) && isFinite(data9))) {
																			validate23.errors = [{
																				instancePath: instancePath + "/dimensions/formal",
																				schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
																				keyword: "type",
																				params: { type: "integer" },
																				message: "must be integer"
																			}];
																			return false;
																		}
																		if (errors === _errs23) {
																			if (typeof data9 == "number" && isFinite(data9)) {
																				if (data9 > 100 || isNaN(data9)) {
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
																				} else if (data9 < 0 || isNaN(data9)) {
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
																		var valid4 = _errs23 === errors;
																	} else var valid4 = true;
																	if (valid4) {
																		if (data5.humor !== void 0) {
																			let data10 = data5.humor;
																			const _errs25 = errors;
																			if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																				validate23.errors = [{
																					instancePath: instancePath + "/dimensions/humor",
																					schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
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
																			var valid4 = _errs25 === errors;
																		} else var valid4 = true;
																		if (valid4) {
																			if (data5.professional !== void 0) {
																				let data11 = data5.professional;
																				const _errs27 = errors;
																				if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																					validate23.errors = [{
																						instancePath: instancePath + "/dimensions/professional",
																						schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
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
																						} else if (data11 < 0 || isNaN(data11)) {
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
																				var valid4 = _errs27 === errors;
																			} else var valid4 = true;
																			if (valid4) {
																				if (data5.social_energy !== void 0) {
																					let data12 = data5.social_energy;
																					const _errs29 = errors;
																					if (!(typeof data12 == "number" && !(data12 % 1) && !isNaN(data12) && isFinite(data12))) {
																						validate23.errors = [{
																							instancePath: instancePath + "/dimensions/social_energy",
																							schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
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
																							} else if (data12 < 0 || isNaN(data12)) {
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
																					var valid4 = _errs29 === errors;
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
										var valid0 = _errs13 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.display_name !== void 0) {
											const _errs31 = errors;
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
											var valid0 = _errs31 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.gender_description !== void 0) {
												let data14 = data.gender_description;
												const _errs33 = errors;
												if (typeof data14 !== "string" && data14 !== null) {
													validate23.errors = [{
														instancePath: instancePath + "/gender_description",
														schemaPath: "#/properties/gender_description/type",
														keyword: "type",
														params: { type: schema34.properties.gender_description.type },
														message: "must be string,null"
													}];
													return false;
												}
												var valid0 = _errs33 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.introduction !== void 0) {
													const _errs35 = errors;
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
													var valid0 = _errs35 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.language_style !== void 0) {
														const _errs37 = errors;
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
														var valid0 = _errs37 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.model !== void 0) {
															let data17 = data.model;
															const _errs39 = errors;
															const _errs40 = errors;
															let valid5 = false;
															const _errs41 = errors;
															if (!validate24(data17, {
																instancePath: instancePath + "/model",
																parentData: data,
																parentDataProperty: "model",
																rootData,
																dynamicAnchors
															})) {
																vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
																errors = vErrors.length;
															}
															var _valid0 = _errs41 === errors;
															valid5 = valid5 || _valid0;
															const _errs42 = errors;
															if (data17 !== null) {
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
															var _valid0 = _errs42 === errors;
															valid5 = valid5 || _valid0;
															if (!valid5) {
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
																errors = _errs40;
																if (vErrors !== null) {
																	if (_errs40) vErrors.length = _errs40;
																	else vErrors = null;
																}
															}
															var valid0 = _errs39 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.preferences !== void 0) {
																let data18 = data.preferences;
																const _errs44 = errors;
																if (errors === errors) {
																	if (data18 && typeof data18 == "object" && !Array.isArray(data18)) {
																		let missing2;
																		if (data18.request_limit_daily === void 0 && (missing2 = "request_limit_daily") || data18.persistent_memory === void 0 && (missing2 = "persistent_memory") || data18.allow_autonomous_wake === void 0 && (missing2 = "allow_autonomous_wake")) {
																			validate23.errors = [{
																				instancePath: instancePath + "/preferences",
																				schemaPath: "#/$defs/AgentPreferences/required",
																				keyword: "required",
																				params: { missingProperty: missing2 },
																				message: "must have required property '" + missing2 + "'"
																			}];
																			return false;
																		} else {
																			const _errs47 = errors;
																			for (const key2 in data18) if (!(key2 === "allow_autonomous_wake" || key2 === "persistent_memory" || key2 === "request_limit_daily")) {
																				validate23.errors = [{
																					instancePath: instancePath + "/preferences",
																					schemaPath: "#/$defs/AgentPreferences/additionalProperties",
																					keyword: "additionalProperties",
																					params: { additionalProperty: key2 },
																					message: "must NOT have additional properties"
																				}];
																				return false;
																			}
																			if (_errs47 === errors) {
																				if (data18.allow_autonomous_wake !== void 0) {
																					const _errs48 = errors;
																					if (typeof data18.allow_autonomous_wake !== "boolean") {
																						validate23.errors = [{
																							instancePath: instancePath + "/preferences/allow_autonomous_wake",
																							schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																							keyword: "type",
																							params: { type: "boolean" },
																							message: "must be boolean"
																						}];
																						return false;
																					}
																					var valid7 = _errs48 === errors;
																				} else var valid7 = true;
																				if (valid7) {
																					if (data18.persistent_memory !== void 0) {
																						const _errs50 = errors;
																						if (typeof data18.persistent_memory !== "boolean") {
																							validate23.errors = [{
																								instancePath: instancePath + "/preferences/persistent_memory",
																								schemaPath: "#/$defs/AgentPreferences/properties/persistent_memory/type",
																								keyword: "type",
																								params: { type: "boolean" },
																								message: "must be boolean"
																							}];
																							return false;
																						}
																						var valid7 = _errs50 === errors;
																					} else var valid7 = true;
																					if (valid7) {
																						if (data18.request_limit_daily !== void 0) {
																							let data21 = data18.request_limit_daily;
																							const _errs52 = errors;
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
																							if (errors === _errs52) {
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
																							var valid7 = _errs52 === errors;
																						} else var valid7 = true;
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
																var valid0 = _errs44 === errors;
															} else var valid0 = true;
															if (valid0) {
																if (data.revision !== void 0) {
																	let data22 = data.revision;
																	const _errs54 = errors;
																	if (errors === errors) {
																		if (typeof data22 === "string") {
																			if (func2(data22) > 19) {
																				validate23.errors = [{
																					instancePath: instancePath + "/revision",
																					schemaPath: "#/$defs/DecimalString/maxLength",
																					keyword: "maxLength",
																					params: { limit: 19 },
																					message: "must NOT have more than 19 characters"
																				}];
																				return false;
																			} else if (!pattern4.test(data22)) {
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
																	var valid0 = _errs54 === errors;
																} else var valid0 = true;
																if (valid0) {
																	if (data.skill !== void 0) {
																		const _errs57 = errors;
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
																		var valid0 = _errs57 === errors;
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
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
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
					if (data.data !== void 0) {
						let data0 = data.data;
						const _errs2 = errors;
						if (errors === _errs2) {
							if (Array.isArray(data0)) {
								const len0 = data0.length;
								for (let i0 = 0; i0 < len0; i0++) {
									const _errs4 = errors;
									if (!validate23(data0[i0], {
										instancePath: instancePath + "/data/" + i0,
										parentData: data0,
										parentDataProperty: i0,
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
										errors = vErrors.length;
									}
									if (!(_errs4 === errors)) break;
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
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data2 = data.schema_version;
							const _errs5 = errors;
							if (typeof data2 !== "string") {
								validate22.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data2 === "0.3")) {
								validate22.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema45.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
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
var schema47 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema48 = {
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
	],
	"type": "string"
};
var schema49 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
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
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
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
						params: { allowedValues: schema48.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate33.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema47.properties.field_path.type },
							message: "must be string,null"
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
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate33.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate33.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema49.enum },
										message: "must be equal to one of the allowed values"
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
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
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
					if (data.error !== void 0) {
						const _errs2 = errors;
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
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate32.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate32.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema45.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
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
export { validateAgentListResponse };
