import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateAgentSaveResponse.js
var validateAgentSaveResponse = validate59;
var schema89 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema81 = {
	"additionalProperties": false,
	"properties": {
		"agent_id": { "type": "string" },
		"agent_type": { "$ref": "#/$defs/AgentType" },
		"avatar_id": { "type": ["string", "null"] },
		"dimensions": { "$ref": "#/$defs/PersonaDimensions" },
		"display_name": {
			"description": "显示名上限按宽度计算：中文 2、英文 1，总量 16（即 8 个中文或 16 个英文）。\n响应契约保留旧数据的宽松上限，写入时由后端按宽度严格校验。",
			"maxLength": 80,
			"type": "string"
		},
		"gender_description": { "type": ["string", "null"] },
		"language_style": { "type": "string" },
		"model": { "anyOf": [{ "$ref": "#/$defs/AgentModelSnapshot" }, { "type": "null" }] },
		"revision": { "$ref": "#/$defs/DecimalString" },
		"skill": { "type": "string" }
	},
	"required": [
		"agent_id",
		"revision",
		"display_name",
		"gender_description",
		"language_style",
		"skill",
		"dimensions",
		"avatar_id",
		"agent_type",
		"model"
	],
	"type": "object"
};
var schema82 = {
	"enum": ["social", "tool"],
	"type": "string"
};
var func1 = Object.prototype.hasOwnProperty;
var func2 = require_ucs2length().default;
var schema86 = {
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	],
	"type": "string"
};
function validate63(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate63.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name")) {
			validate63.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "base_url" || key0 === "id" || key0 === "model_name" || key0 === "name" || key0 === "protocol")) {
				validate63.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.base_url !== void 0) {
				let data0 = data.base_url;
				if (typeof data0 === "string") {
					if (func2(data0) > 2048) {
						validate63.errors = [{
							instancePath: instancePath + "/base_url",
							schemaPath: "#/properties/base_url/maxLength",
							keyword: "maxLength",
							params: { limit: 2048 },
							message: "must NOT have more than 2048 characters"
						}];
						return false;
					}
				} else {
					validate63.errors = [{
						instancePath: instancePath + "/base_url",
						schemaPath: "#/properties/base_url/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.id !== void 0) {
					if (typeof data.id !== "string") {
						validate63.errors = [{
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
					if (data.model_name !== void 0) {
						let data2 = data.model_name;
						if (typeof data2 === "string") {
							if (func2(data2) > 200) {
								validate63.errors = [{
									instancePath: instancePath + "/model_name",
									schemaPath: "#/properties/model_name/maxLength",
									keyword: "maxLength",
									params: { limit: 200 },
									message: "must NOT have more than 200 characters"
								}];
								return false;
							}
						} else {
							validate63.errors = [{
								instancePath: instancePath + "/model_name",
								schemaPath: "#/properties/model_name/type",
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
							let data3 = data.name;
							if (typeof data3 === "string") {
								if (func2(data3) > 80) {
									validate63.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/maxLength",
										keyword: "maxLength",
										params: { limit: 80 },
										message: "must NOT have more than 80 characters"
									}];
									return false;
								} else if (func2(data3) < 1) {
									validate63.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/minLength",
										keyword: "minLength",
										params: { limit: 1 },
										message: "must NOT have fewer than 1 characters"
									}];
									return false;
								}
							} else {
								validate63.errors = [{
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
							if (data.protocol !== void 0) {
								let data4 = data.protocol;
								if (typeof data4 !== "string") {
									validate63.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "openai_chat_completions" || data4 === "anthropic_messages" || data4 === "openai_responses")) {
									validate63.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema86.enum },
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
		validate63.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate63.errors = vErrors;
	return true;
}
validate63.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate62(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate62.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.source_profile_id === void 0 && (missing0 = "source_profile_id") || data.source_profile_revision === void 0 && (missing0 = "source_profile_revision") || data.profile === void 0 && (missing0 = "profile")) {
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
				for (const key0 in data) if (!(key0 === "profile" || key0 === "source_profile_id" || key0 === "source_profile_revision")) {
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
					if (data.profile !== void 0) {
						const _errs2 = errors;
						if (!validate63(data.profile, {
							instancePath: instancePath + "/profile",
							parentData: data,
							parentDataProperty: "profile",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate63.errors : vErrors.concat(validate63.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.source_profile_id !== void 0) {
							const _errs3 = errors;
							if (typeof data.source_profile_id !== "string") {
								validate62.errors = [{
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
											validate62.errors = [{
												instancePath: instancePath + "/source_profile_revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate62.errors = [{
												instancePath: instancePath + "/source_profile_revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate62.errors = [{
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
function validate61(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate61.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.agent_id === void 0 && (missing0 = "agent_id") || data.revision === void 0 && (missing0 = "revision") || data.display_name === void 0 && (missing0 = "display_name") || data.gender_description === void 0 && (missing0 = "gender_description") || data.language_style === void 0 && (missing0 = "language_style") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.agent_type === void 0 && (missing0 = "agent_type") || data.model === void 0 && (missing0 = "model")) {
				validate61.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema81.properties, key0)) {
					validate61.errors = [{
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
							validate61.errors = [{
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
						if (data.agent_type !== void 0) {
							let data1 = data.agent_type;
							const _errs4 = errors;
							if (typeof data1 !== "string") {
								validate61.errors = [{
									instancePath: instancePath + "/agent_type",
									schemaPath: "#/$defs/AgentType/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "social" || data1 === "tool")) {
								validate61.errors = [{
									instancePath: instancePath + "/agent_type",
									schemaPath: "#/$defs/AgentType/enum",
									keyword: "enum",
									params: { allowedValues: schema82.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.avatar_id !== void 0) {
								let data2 = data.avatar_id;
								const _errs7 = errors;
								if (typeof data2 !== "string" && data2 !== null) {
									validate61.errors = [{
										instancePath: instancePath + "/avatar_id",
										schemaPath: "#/properties/avatar_id/type",
										keyword: "type",
										params: { type: schema81.properties.avatar_id.type },
										message: "must be string,null"
									}];
									return false;
								}
								var valid0 = _errs7 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.dimensions !== void 0) {
									let data3 = data.dimensions;
									const _errs9 = errors;
									if (errors === errors) {
										if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
											let missing1;
											if (data3.professional === void 0 && (missing1 = "professional") || data3.formal === void 0 && (missing1 = "formal") || data3.casual === void 0 && (missing1 = "casual") || data3.humor === void 0 && (missing1 = "humor") || data3.direct === void 0 && (missing1 = "direct") || data3.empathy === void 0 && (missing1 = "empathy") || data3.social_energy === void 0 && (missing1 = "social_energy") || data3.activity === void 0 && (missing1 = "activity")) {
												validate61.errors = [{
													instancePath: instancePath + "/dimensions",
													schemaPath: "#/$defs/PersonaDimensions/required",
													keyword: "required",
													params: { missingProperty: missing1 },
													message: "must have required property '" + missing1 + "'"
												}];
												return false;
											} else {
												const _errs12 = errors;
												for (const key1 in data3) if (!(key1 === "activity" || key1 === "casual" || key1 === "direct" || key1 === "empathy" || key1 === "formal" || key1 === "humor" || key1 === "professional" || key1 === "social_energy")) {
													validate61.errors = [{
														instancePath: instancePath + "/dimensions",
														schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
														keyword: "additionalProperties",
														params: { additionalProperty: key1 },
														message: "must NOT have additional properties"
													}];
													return false;
												}
												if (_errs12 === errors) {
													if (data3.activity !== void 0) {
														let data4 = data3.activity;
														const _errs13 = errors;
														if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
															validate61.errors = [{
																instancePath: instancePath + "/dimensions/activity",
																schemaPath: "#/$defs/PersonaDimensions/properties/activity/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (errors === _errs13) {
															if (typeof data4 == "number" && isFinite(data4)) {
																if (data4 > 100 || isNaN(data4)) {
																	validate61.errors = [{
																		instancePath: instancePath + "/dimensions/activity",
																		schemaPath: "#/$defs/PersonaDimensions/properties/activity/maximum",
																		keyword: "maximum",
																		params: {
																			comparison: "<=",
																			limit: 100
																		},
																		message: "must be <= 100"
																	}];
																	return false;
																} else if (data4 < 0 || isNaN(data4)) {
																	validate61.errors = [{
																		instancePath: instancePath + "/dimensions/activity",
																		schemaPath: "#/$defs/PersonaDimensions/properties/activity/minimum",
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
														var valid3 = _errs13 === errors;
													} else var valid3 = true;
													if (valid3) {
														if (data3.casual !== void 0) {
															let data5 = data3.casual;
															const _errs15 = errors;
															if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5))) {
																validate61.errors = [{
																	instancePath: instancePath + "/dimensions/casual",
																	schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																}];
																return false;
															}
															if (errors === _errs15) {
																if (typeof data5 == "number" && isFinite(data5)) {
																	if (data5 > 100 || isNaN(data5)) {
																		validate61.errors = [{
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
																	} else if (data5 < 0 || isNaN(data5)) {
																		validate61.errors = [{
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
															var valid3 = _errs15 === errors;
														} else var valid3 = true;
														if (valid3) {
															if (data3.direct !== void 0) {
																let data6 = data3.direct;
																const _errs17 = errors;
																if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
																	validate61.errors = [{
																		instancePath: instancePath + "/dimensions/direct",
																		schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
																		keyword: "type",
																		params: { type: "integer" },
																		message: "must be integer"
																	}];
																	return false;
																}
																if (errors === _errs17) {
																	if (typeof data6 == "number" && isFinite(data6)) {
																		if (data6 > 100 || isNaN(data6)) {
																			validate61.errors = [{
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
																		} else if (data6 < 0 || isNaN(data6)) {
																			validate61.errors = [{
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
																var valid3 = _errs17 === errors;
															} else var valid3 = true;
															if (valid3) {
																if (data3.empathy !== void 0) {
																	let data7 = data3.empathy;
																	const _errs19 = errors;
																	if (!(typeof data7 == "number" && !(data7 % 1) && !isNaN(data7) && isFinite(data7))) {
																		validate61.errors = [{
																			instancePath: instancePath + "/dimensions/empathy",
																			schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
																			keyword: "type",
																			params: { type: "integer" },
																			message: "must be integer"
																		}];
																		return false;
																	}
																	if (errors === _errs19) {
																		if (typeof data7 == "number" && isFinite(data7)) {
																			if (data7 > 100 || isNaN(data7)) {
																				validate61.errors = [{
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
																			} else if (data7 < 0 || isNaN(data7)) {
																				validate61.errors = [{
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
																	var valid3 = _errs19 === errors;
																} else var valid3 = true;
																if (valid3) {
																	if (data3.formal !== void 0) {
																		let data8 = data3.formal;
																		const _errs21 = errors;
																		if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
																			validate61.errors = [{
																				instancePath: instancePath + "/dimensions/formal",
																				schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
																				keyword: "type",
																				params: { type: "integer" },
																				message: "must be integer"
																			}];
																			return false;
																		}
																		if (errors === _errs21) {
																			if (typeof data8 == "number" && isFinite(data8)) {
																				if (data8 > 100 || isNaN(data8)) {
																					validate61.errors = [{
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
																					validate61.errors = [{
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
																		var valid3 = _errs21 === errors;
																	} else var valid3 = true;
																	if (valid3) {
																		if (data3.humor !== void 0) {
																			let data9 = data3.humor;
																			const _errs23 = errors;
																			if (!(typeof data9 == "number" && !(data9 % 1) && !isNaN(data9) && isFinite(data9))) {
																				validate61.errors = [{
																					instancePath: instancePath + "/dimensions/humor",
																					schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
																					keyword: "type",
																					params: { type: "integer" },
																					message: "must be integer"
																				}];
																				return false;
																			}
																			if (errors === _errs23) {
																				if (typeof data9 == "number" && isFinite(data9)) {
																					if (data9 > 100 || isNaN(data9)) {
																						validate61.errors = [{
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
																					} else if (data9 < 0 || isNaN(data9)) {
																						validate61.errors = [{
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
																			var valid3 = _errs23 === errors;
																		} else var valid3 = true;
																		if (valid3) {
																			if (data3.professional !== void 0) {
																				let data10 = data3.professional;
																				const _errs25 = errors;
																				if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																					validate61.errors = [{
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
																							validate61.errors = [{
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
																							validate61.errors = [{
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
																				var valid3 = _errs25 === errors;
																			} else var valid3 = true;
																			if (valid3) {
																				if (data3.social_energy !== void 0) {
																					let data11 = data3.social_energy;
																					const _errs27 = errors;
																					if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																						validate61.errors = [{
																							instancePath: instancePath + "/dimensions/social_energy",
																							schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																							keyword: "type",
																							params: { type: "integer" },
																							message: "must be integer"
																						}];
																						return false;
																					}
																					if (errors === _errs27) {
																						if (typeof data11 == "number" && isFinite(data11)) {
																							if (data11 > 100 || isNaN(data11)) {
																								validate61.errors = [{
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
																							} else if (data11 < 0 || isNaN(data11)) {
																								validate61.errors = [{
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
																					var valid3 = _errs27 === errors;
																				} else var valid3 = true;
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
											validate61.errors = [{
												instancePath: instancePath + "/dimensions",
												schemaPath: "#/$defs/PersonaDimensions/type",
												keyword: "type",
												params: { type: "object" },
												message: "must be object"
											}];
											return false;
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.display_name !== void 0) {
										let data12 = data.display_name;
										const _errs29 = errors;
										if (errors === _errs29) {
											if (typeof data12 === "string") {
												if (func2(data12) > 80) {
													validate61.errors = [{
														instancePath: instancePath + "/display_name",
														schemaPath: "#/properties/display_name/maxLength",
														keyword: "maxLength",
														params: { limit: 80 },
														message: "must NOT have more than 80 characters"
													}];
													return false;
												}
											} else {
												validate61.errors = [{
													instancePath: instancePath + "/display_name",
													schemaPath: "#/properties/display_name/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
										}
										var valid0 = _errs29 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.gender_description !== void 0) {
											let data13 = data.gender_description;
											const _errs31 = errors;
											if (typeof data13 !== "string" && data13 !== null) {
												validate61.errors = [{
													instancePath: instancePath + "/gender_description",
													schemaPath: "#/properties/gender_description/type",
													keyword: "type",
													params: { type: schema81.properties.gender_description.type },
													message: "must be string,null"
												}];
												return false;
											}
											var valid0 = _errs31 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.language_style !== void 0) {
												const _errs33 = errors;
												if (typeof data.language_style !== "string") {
													validate61.errors = [{
														instancePath: instancePath + "/language_style",
														schemaPath: "#/properties/language_style/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												var valid0 = _errs33 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.model !== void 0) {
													let data15 = data.model;
													const _errs35 = errors;
													const _errs36 = errors;
													let valid4 = false;
													const _errs37 = errors;
													if (!validate62(data15, {
														instancePath: instancePath + "/model",
														parentData: data,
														parentDataProperty: "model",
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
														errors = vErrors.length;
													}
													var _valid0 = _errs37 === errors;
													valid4 = valid4 || _valid0;
													const _errs38 = errors;
													if (data15 !== null) {
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
													var _valid0 = _errs38 === errors;
													valid4 = valid4 || _valid0;
													if (!valid4) {
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
														validate61.errors = vErrors;
														return false;
													} else {
														errors = _errs36;
														if (vErrors !== null) {
															if (_errs36) vErrors.length = _errs36;
															else vErrors = null;
														}
													}
													var valid0 = _errs35 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.revision !== void 0) {
														let data16 = data.revision;
														const _errs40 = errors;
														if (errors === errors) {
															if (typeof data16 === "string") {
																if (func2(data16) > 19) {
																	validate61.errors = [{
																		instancePath: instancePath + "/revision",
																		schemaPath: "#/$defs/DecimalString/maxLength",
																		keyword: "maxLength",
																		params: { limit: 19 },
																		message: "must NOT have more than 19 characters"
																	}];
																	return false;
																} else if (!pattern4.test(data16)) {
																	validate61.errors = [{
																		instancePath: instancePath + "/revision",
																		schemaPath: "#/$defs/DecimalString/pattern",
																		keyword: "pattern",
																		params: { pattern: "^(0|[1-9][0-9]*)$" },
																		message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																	}];
																	return false;
																}
															} else {
																validate61.errors = [{
																	instancePath: instancePath + "/revision",
																	schemaPath: "#/$defs/DecimalString/type",
																	keyword: "type",
																	params: { type: "string" },
																	message: "must be string"
																}];
																return false;
															}
														}
														var valid0 = _errs40 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.skill !== void 0) {
															const _errs43 = errors;
															if (typeof data.skill !== "string") {
																validate61.errors = [{
																	instancePath: instancePath + "/skill",
																	schemaPath: "#/properties/skill/type",
																	keyword: "type",
																	params: { type: "string" },
																	message: "must be string"
																}];
																return false;
															}
															var valid0 = _errs43 === errors;
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
			validate61.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate61.errors = vErrors;
	return errors === 0;
}
validate61.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate60(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate60.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate60.errors = [{
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
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate61(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate61.errors : vErrors.concat(validate61.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate60.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate60.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema89.enum },
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
var schema91 = {
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
var schema92 = { "oneOf": [{
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
}, {
	"const": "MODEL_OUTPUT_INVALID",
	"description": "模型本轮输出不符合决策协议。属于可恢复的单轮失败，不应停用智能体。",
	"type": "string"
}] };
var schema93 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate69(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate69.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
				validate69.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
					validate69.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.code !== void 0) {
						let data0 = data.code;
						const _errs2 = errors;
						const _errs4 = errors;
						let valid2 = false;
						let passing0 = null;
						const _errs5 = errors;
						if (typeof data0 !== "string") {
							const err0 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf/0/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err0];
							else vErrors.push(err0);
							errors++;
						}
						if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
							const err1 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf/0/enum",
								keyword: "enum",
								params: { allowedValues: schema92.oneOf[0].enum },
								message: "must be equal to one of the allowed values"
							};
							if (vErrors === null) vErrors = [err1];
							else vErrors.push(err1);
							errors++;
						}
						var _valid0 = _errs5 === errors;
						if (_valid0) {
							valid2 = true;
							passing0 = 0;
						}
						const _errs7 = errors;
						if (typeof data0 !== "string") {
							const err2 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf/1/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err2];
							else vErrors.push(err2);
							errors++;
						}
						if ("MODEL_OUTPUT_INVALID" !== data0) {
							const err3 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf/1/const",
								keyword: "const",
								params: { allowedValue: "MODEL_OUTPUT_INVALID" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var _valid0 = _errs7 === errors;
						if (_valid0 && valid2) {
							valid2 = false;
							passing0 = [passing0, 1];
						} else if (_valid0) {
							valid2 = true;
							passing0 = 1;
						}
						if (!valid2) {
							const err4 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf",
								keyword: "oneOf",
								params: { passingSchemas: passing0 },
								message: "must match exactly one schema in oneOf"
							};
							if (vErrors === null) vErrors = [err4];
							else vErrors.push(err4);
							errors++;
							validate69.errors = vErrors;
							return false;
						} else {
							errors = _errs4;
							if (vErrors !== null) {
								if (_errs4) vErrors.length = _errs4;
								else vErrors = null;
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data1 = data.field_path;
							const _errs9 = errors;
							if (typeof data1 !== "string" && data1 !== null) {
								validate69.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema91.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = _errs9 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.may_have_been_charged !== void 0) {
								const _errs11 = errors;
								if (typeof data.may_have_been_charged !== "boolean") {
									validate69.errors = [{
										instancePath: instancePath + "/may_have_been_charged",
										schemaPath: "#/properties/may_have_been_charged/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs11 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.message !== void 0) {
									const _errs13 = errors;
									if (typeof data.message !== "string") {
										validate69.errors = [{
											instancePath: instancePath + "/message",
											schemaPath: "#/properties/message/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs13 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.retryability !== void 0) {
										let data4 = data.retryability;
										const _errs15 = errors;
										if (typeof data4 !== "string") {
											validate69.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
											validate69.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/enum",
												keyword: "enum",
												params: { allowedValues: schema93.enum },
												message: "must be equal to one of the allowed values"
											}];
											return false;
										}
										var valid0 = _errs15 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.trace_id !== void 0) {
											const _errs18 = errors;
											if (typeof data.trace_id !== "string") {
												validate69.errors = [{
													instancePath: instancePath + "/trace_id",
													schemaPath: "#/properties/trace_id/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											var valid0 = _errs18 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
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
	}
	validate69.errors = vErrors;
	return errors === 0;
}
validate69.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate68(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate68.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate68.errors = [{
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
					validate68.errors = [{
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
						if (!validate69(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate68.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate68.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema89.enum },
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
			validate68.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate68.errors = vErrors;
	return errors === 0;
}
validate68.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate59(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate59.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate60(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate60.errors : vErrors.concat(validate60.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate68(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate68.errors : vErrors.concat(validate68.errors);
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
		validate59.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate59.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate59.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateAgentSaveResponse };
