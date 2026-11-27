import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateAgentSaveRequest.js
var validateAgentSaveRequest = validate52;
var schema70 = {
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
		"local_tools_enabled": { "type": ["boolean", "null"] },
		"model": { "anyOf": [{ "$ref": "#/$defs/AgentModelSnapshot" }, { "type": "null" }] },
		"revision": { "$ref": "#/$defs/DecimalString" },
		"skill": { "type": "string" }
	},
	"required": [
		"agent_id",
		"revision",
		"display_name",
		"language_style",
		"skill",
		"dimensions",
		"agent_type"
	],
	"type": "object"
};
var schema71 = {
	"enum": ["social", "tool"],
	"type": "string"
};
var func1 = Object.prototype.hasOwnProperty;
var func2 = require_ucs2length().default;
var schema75 = {
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	],
	"type": "string"
};
function validate55(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate55.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name")) {
			validate55.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "base_url" || key0 === "id" || key0 === "model_name" || key0 === "name" || key0 === "protocol")) {
				validate55.errors = [{
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
						validate55.errors = [{
							instancePath: instancePath + "/base_url",
							schemaPath: "#/properties/base_url/maxLength",
							keyword: "maxLength",
							params: { limit: 2048 },
							message: "must NOT have more than 2048 characters"
						}];
						return false;
					}
				} else {
					validate55.errors = [{
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
						validate55.errors = [{
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
								validate55.errors = [{
									instancePath: instancePath + "/model_name",
									schemaPath: "#/properties/model_name/maxLength",
									keyword: "maxLength",
									params: { limit: 200 },
									message: "must NOT have more than 200 characters"
								}];
								return false;
							}
						} else {
							validate55.errors = [{
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
									validate55.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/maxLength",
										keyword: "maxLength",
										params: { limit: 80 },
										message: "must NOT have more than 80 characters"
									}];
									return false;
								} else if (func2(data3) < 1) {
									validate55.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/minLength",
										keyword: "minLength",
										params: { limit: 1 },
										message: "must NOT have fewer than 1 characters"
									}];
									return false;
								}
							} else {
								validate55.errors = [{
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
									validate55.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "openai_chat_completions" || data4 === "anthropic_messages" || data4 === "openai_responses")) {
									validate55.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema75.enum },
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
		validate55.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate55.errors = vErrors;
	return true;
}
validate55.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate54(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate54.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.source_profile_id === void 0 && (missing0 = "source_profile_id") || data.source_profile_revision === void 0 && (missing0 = "source_profile_revision") || data.profile === void 0 && (missing0 = "profile")) {
				validate54.errors = [{
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
					validate54.errors = [{
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
						if (!validate55(data.profile, {
							instancePath: instancePath + "/profile",
							parentData: data,
							parentDataProperty: "profile",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.source_profile_id !== void 0) {
							const _errs3 = errors;
							if (typeof data.source_profile_id !== "string") {
								validate54.errors = [{
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
											validate54.errors = [{
												instancePath: instancePath + "/source_profile_revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate54.errors = [{
												instancePath: instancePath + "/source_profile_revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate54.errors = [{
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
			validate54.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate54.errors = vErrors;
	return errors === 0;
}
validate54.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate53(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate53.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.agent_id === void 0 && (missing0 = "agent_id") || data.revision === void 0 && (missing0 = "revision") || data.display_name === void 0 && (missing0 = "display_name") || data.language_style === void 0 && (missing0 = "language_style") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.agent_type === void 0 && (missing0 = "agent_type")) {
				validate53.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema70.properties, key0)) {
					validate53.errors = [{
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
							validate53.errors = [{
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
								validate53.errors = [{
									instancePath: instancePath + "/agent_type",
									schemaPath: "#/$defs/AgentType/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "social" || data1 === "tool")) {
								validate53.errors = [{
									instancePath: instancePath + "/agent_type",
									schemaPath: "#/$defs/AgentType/enum",
									keyword: "enum",
									params: { allowedValues: schema71.enum },
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
									validate53.errors = [{
										instancePath: instancePath + "/avatar_id",
										schemaPath: "#/properties/avatar_id/type",
										keyword: "type",
										params: { type: schema70.properties.avatar_id.type },
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
												validate53.errors = [{
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
													validate53.errors = [{
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
															validate53.errors = [{
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
																	validate53.errors = [{
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
																	validate53.errors = [{
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
																validate53.errors = [{
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
																		validate53.errors = [{
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
																		validate53.errors = [{
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
																	validate53.errors = [{
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
																			validate53.errors = [{
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
																			validate53.errors = [{
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
																		validate53.errors = [{
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
																				validate53.errors = [{
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
																				validate53.errors = [{
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
																			validate53.errors = [{
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
																					validate53.errors = [{
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
																					validate53.errors = [{
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
																				validate53.errors = [{
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
																						validate53.errors = [{
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
																						validate53.errors = [{
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
																					validate53.errors = [{
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
																							validate53.errors = [{
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
																							validate53.errors = [{
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
																						validate53.errors = [{
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
																								validate53.errors = [{
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
																								validate53.errors = [{
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
											validate53.errors = [{
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
													validate53.errors = [{
														instancePath: instancePath + "/display_name",
														schemaPath: "#/properties/display_name/maxLength",
														keyword: "maxLength",
														params: { limit: 80 },
														message: "must NOT have more than 80 characters"
													}];
													return false;
												}
											} else {
												validate53.errors = [{
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
												validate53.errors = [{
													instancePath: instancePath + "/gender_description",
													schemaPath: "#/properties/gender_description/type",
													keyword: "type",
													params: { type: schema70.properties.gender_description.type },
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
													validate53.errors = [{
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
												if (data.local_tools_enabled !== void 0) {
													let data15 = data.local_tools_enabled;
													const _errs35 = errors;
													if (typeof data15 !== "boolean" && data15 !== null) {
														validate53.errors = [{
															instancePath: instancePath + "/local_tools_enabled",
															schemaPath: "#/properties/local_tools_enabled/type",
															keyword: "type",
															params: { type: schema70.properties.local_tools_enabled.type },
															message: "must be boolean,null"
														}];
														return false;
													}
													var valid0 = _errs35 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.model !== void 0) {
														let data16 = data.model;
														const _errs37 = errors;
														const _errs38 = errors;
														let valid4 = false;
														const _errs39 = errors;
														if (!validate54(data16, {
															instancePath: instancePath + "/model",
															parentData: data,
															parentDataProperty: "model",
															rootData,
															dynamicAnchors
														})) {
															vErrors = vErrors === null ? validate54.errors : vErrors.concat(validate54.errors);
															errors = vErrors.length;
														}
														var _valid0 = _errs39 === errors;
														valid4 = valid4 || _valid0;
														const _errs40 = errors;
														if (data16 !== null) {
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
														var _valid0 = _errs40 === errors;
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
															validate53.errors = vErrors;
															return false;
														} else {
															errors = _errs38;
															if (vErrors !== null) {
																if (_errs38) vErrors.length = _errs38;
																else vErrors = null;
															}
														}
														var valid0 = _errs37 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.revision !== void 0) {
															let data17 = data.revision;
															const _errs42 = errors;
															if (errors === errors) {
																if (typeof data17 === "string") {
																	if (func2(data17) > 19) {
																		validate53.errors = [{
																			instancePath: instancePath + "/revision",
																			schemaPath: "#/$defs/DecimalString/maxLength",
																			keyword: "maxLength",
																			params: { limit: 19 },
																			message: "must NOT have more than 19 characters"
																		}];
																		return false;
																	} else if (!pattern4.test(data17)) {
																		validate53.errors = [{
																			instancePath: instancePath + "/revision",
																			schemaPath: "#/$defs/DecimalString/pattern",
																			keyword: "pattern",
																			params: { pattern: "^(0|[1-9][0-9]*)$" },
																			message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																		}];
																		return false;
																	}
																} else {
																	validate53.errors = [{
																		instancePath: instancePath + "/revision",
																		schemaPath: "#/$defs/DecimalString/type",
																		keyword: "type",
																		params: { type: "string" },
																		message: "must be string"
																	}];
																	return false;
																}
															}
															var valid0 = _errs42 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.skill !== void 0) {
																const _errs45 = errors;
																if (typeof data.skill !== "string") {
																	validate53.errors = [{
																		instancePath: instancePath + "/skill",
																		schemaPath: "#/properties/skill/type",
																		keyword: "type",
																		params: { type: "string" },
																		message: "must be string"
																	}];
																	return false;
																}
																var valid0 = _errs45 === errors;
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
		} else {
			validate53.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate53.errors = vErrors;
	return errors === 0;
}
validate53.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate52(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate52.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.configuration === void 0 && (missing0 = "configuration")) {
				validate52.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "configuration" || key0 === "data_generation_id" || key0 === "expected_revision")) {
					validate52.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.client_request_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.client_request_id !== "string") {
							validate52.errors = [{
								instancePath: instancePath + "/client_request_id",
								schemaPath: "#/properties/client_request_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.configuration !== void 0) {
							const _errs4 = errors;
							if (!validate53(data.configuration, {
								instancePath: instancePath + "/configuration",
								parentData: data,
								parentDataProperty: "configuration",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.data_generation_id !== void 0) {
								const _errs5 = errors;
								if (typeof data.data_generation_id !== "string") {
									validate52.errors = [{
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
								if (data.expected_revision !== void 0) {
									let data3 = data.expected_revision;
									const _errs7 = errors;
									const _errs8 = errors;
									let valid1 = false;
									const _errs9 = errors;
									if (errors === errors) {
										if (typeof data3 === "string") {
											if (func2(data3) > 19) {
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
											} else if (!pattern4.test(data3)) {
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
									var _valid0 = _errs9 === errors;
									valid1 = valid1 || _valid0;
									const _errs12 = errors;
									if (data3 !== null) {
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
									var _valid0 = _errs12 === errors;
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
										validate52.errors = vErrors;
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
							}
						}
					}
				}
			}
		} else {
			validate52.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate52.errors = vErrors;
	return errors === 0;
}
validate52.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateAgentSaveRequest };
