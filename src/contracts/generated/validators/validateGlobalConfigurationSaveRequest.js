import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateGlobalConfigurationSaveRequest.js
var validateGlobalConfigurationSaveRequest = validate276;
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
var schema365 = {
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	],
	"type": "string"
};
function validate277(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate277.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name")) {
			validate277.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "base_url" || key0 === "id" || key0 === "model_name" || key0 === "name" || key0 === "protocol")) {
				validate277.errors = [{
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
						validate277.errors = [{
							instancePath: instancePath + "/base_url",
							schemaPath: "#/properties/base_url/maxLength",
							keyword: "maxLength",
							params: { limit: 2048 },
							message: "must NOT have more than 2048 characters"
						}];
						return false;
					}
				} else {
					validate277.errors = [{
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
						validate277.errors = [{
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
								validate277.errors = [{
									instancePath: instancePath + "/model_name",
									schemaPath: "#/properties/model_name/maxLength",
									keyword: "maxLength",
									params: { limit: 200 },
									message: "must NOT have more than 200 characters"
								}];
								return false;
							}
						} else {
							validate277.errors = [{
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
									validate277.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/maxLength",
										keyword: "maxLength",
										params: { limit: 80 },
										message: "must NOT have more than 80 characters"
									}];
									return false;
								} else if (func2(data3) < 1) {
									validate277.errors = [{
										instancePath: instancePath + "/name",
										schemaPath: "#/properties/name/minLength",
										keyword: "minLength",
										params: { limit: 1 },
										message: "must NOT have fewer than 1 characters"
									}];
									return false;
								}
							} else {
								validate277.errors = [{
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
									validate277.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "openai_chat_completions" || data4 === "anthropic_messages" || data4 === "openai_responses")) {
									validate277.errors = [{
										instancePath: instancePath + "/protocol",
										schemaPath: "#/$defs/ModelProtocol/enum",
										keyword: "enum",
										params: { allowedValues: schema365.enum },
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
		validate277.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate277.errors = vErrors;
	return true;
}
validate277.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate279(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate279.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.language_style === void 0 && (missing0 = "language_style") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.revision === void 0 && (missing0 = "revision")) {
			validate279.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "dimensions" || key0 === "id" || key0 === "language_style" || key0 === "name" || key0 === "revision" || key0 === "skill")) {
				validate279.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.dimensions !== void 0) {
				let data0 = data.dimensions;
				if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
					let missing1;
					if (data0.professional === void 0 && (missing1 = "professional") || data0.formal === void 0 && (missing1 = "formal") || data0.casual === void 0 && (missing1 = "casual") || data0.humor === void 0 && (missing1 = "humor") || data0.direct === void 0 && (missing1 = "direct") || data0.empathy === void 0 && (missing1 = "empathy") || data0.social_energy === void 0 && (missing1 = "social_energy") || data0.activity === void 0 && (missing1 = "activity")) {
						validate279.errors = [{
							instancePath: instancePath + "/dimensions",
							schemaPath: "#/$defs/PersonaDimensions/required",
							keyword: "required",
							params: { missingProperty: missing1 },
							message: "must have required property '" + missing1 + "'"
						}];
						return false;
					} else {
						for (const key1 in data0) if (!(key1 === "activity" || key1 === "casual" || key1 === "direct" || key1 === "empathy" || key1 === "formal" || key1 === "humor" || key1 === "professional" || key1 === "social_energy")) {
							validate279.errors = [{
								instancePath: instancePath + "/dimensions",
								schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
								keyword: "additionalProperties",
								params: { additionalProperty: key1 },
								message: "must NOT have additional properties"
							}];
							return false;
						}
						if (data0.activity !== void 0) {
							let data1 = data0.activity;
							if (!(typeof data1 == "number" && !(data1 % 1) && !isNaN(data1) && isFinite(data1))) {
								validate279.errors = [{
									instancePath: instancePath + "/dimensions/activity",
									schemaPath: "#/$defs/PersonaDimensions/properties/activity/type",
									keyword: "type",
									params: { type: "integer" },
									message: "must be integer"
								}];
								return false;
							}
							if (typeof data1 == "number" && isFinite(data1)) {
								if (data1 > 100 || isNaN(data1)) {
									validate279.errors = [{
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
								} else if (data1 < 0 || isNaN(data1)) {
									validate279.errors = [{
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
							var valid2 = true;
						} else var valid2 = true;
						if (valid2) {
							if (data0.casual !== void 0) {
								let data2 = data0.casual;
								if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
									validate279.errors = [{
										instancePath: instancePath + "/dimensions/casual",
										schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (typeof data2 == "number" && isFinite(data2)) {
									if (data2 > 100 || isNaN(data2)) {
										validate279.errors = [{
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
									} else if (data2 < 0 || isNaN(data2)) {
										validate279.errors = [{
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
								var valid2 = true;
							} else var valid2 = true;
							if (valid2) {
								if (data0.direct !== void 0) {
									let data3 = data0.direct;
									if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
										validate279.errors = [{
											instancePath: instancePath + "/dimensions/direct",
											schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
											keyword: "type",
											params: { type: "integer" },
											message: "must be integer"
										}];
										return false;
									}
									if (typeof data3 == "number" && isFinite(data3)) {
										if (data3 > 100 || isNaN(data3)) {
											validate279.errors = [{
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
										} else if (data3 < 0 || isNaN(data3)) {
											validate279.errors = [{
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
									var valid2 = true;
								} else var valid2 = true;
								if (valid2) {
									if (data0.empathy !== void 0) {
										let data4 = data0.empathy;
										if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
											validate279.errors = [{
												instancePath: instancePath + "/dimensions/empathy",
												schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (typeof data4 == "number" && isFinite(data4)) {
											if (data4 > 100 || isNaN(data4)) {
												validate279.errors = [{
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
											} else if (data4 < 0 || isNaN(data4)) {
												validate279.errors = [{
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
										var valid2 = true;
									} else var valid2 = true;
									if (valid2) {
										if (data0.formal !== void 0) {
											let data5 = data0.formal;
											if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5))) {
												validate279.errors = [{
													instancePath: instancePath + "/dimensions/formal",
													schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
													keyword: "type",
													params: { type: "integer" },
													message: "must be integer"
												}];
												return false;
											}
											if (typeof data5 == "number" && isFinite(data5)) {
												if (data5 > 100 || isNaN(data5)) {
													validate279.errors = [{
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
												} else if (data5 < 0 || isNaN(data5)) {
													validate279.errors = [{
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
											var valid2 = true;
										} else var valid2 = true;
										if (valid2) {
											if (data0.humor !== void 0) {
												let data6 = data0.humor;
												if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
													validate279.errors = [{
														instancePath: instancePath + "/dimensions/humor",
														schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
														keyword: "type",
														params: { type: "integer" },
														message: "must be integer"
													}];
													return false;
												}
												if (typeof data6 == "number" && isFinite(data6)) {
													if (data6 > 100 || isNaN(data6)) {
														validate279.errors = [{
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
													} else if (data6 < 0 || isNaN(data6)) {
														validate279.errors = [{
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
												var valid2 = true;
											} else var valid2 = true;
											if (valid2) {
												if (data0.professional !== void 0) {
													let data7 = data0.professional;
													if (!(typeof data7 == "number" && !(data7 % 1) && !isNaN(data7) && isFinite(data7))) {
														validate279.errors = [{
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
															validate279.errors = [{
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
															validate279.errors = [{
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
													var valid2 = true;
												} else var valid2 = true;
												if (valid2) {
													if (data0.social_energy !== void 0) {
														let data8 = data0.social_energy;
														if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
															validate279.errors = [{
																instancePath: instancePath + "/dimensions/social_energy",
																schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (typeof data8 == "number" && isFinite(data8)) {
															if (data8 > 100 || isNaN(data8)) {
																validate279.errors = [{
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
															} else if (data8 < 0 || isNaN(data8)) {
																validate279.errors = [{
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
														var valid2 = true;
													} else var valid2 = true;
												}
											}
										}
									}
								}
							}
						}
					}
				} else {
					validate279.errors = [{
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
				if (data.id !== void 0) {
					if (typeof data.id !== "string") {
						validate279.errors = [{
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
					if (data.language_style !== void 0) {
						if (typeof data.language_style !== "string") {
							validate279.errors = [{
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
						if (data.name !== void 0) {
							if (typeof data.name !== "string") {
								validate279.errors = [{
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
							if (data.revision !== void 0) {
								let data12 = data.revision;
								if (typeof data12 === "string") {
									if (func2(data12) > 19) {
										validate279.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data12)) {
										validate279.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate279.errors = [{
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
								if (data.skill !== void 0) {
									if (typeof data.skill !== "string") {
										validate279.errors = [{
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
							}
						}
					}
				}
			}
		}
	} else {
		validate279.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate279.errors = vErrors;
	return true;
}
validate279.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate276(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate276.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.model_profiles === void 0 && (missing0 = "model_profiles") || data.persona_presets === void 0 && (missing0 = "persona_presets")) {
				validate276.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "expected_revision" || key0 === "model_profiles" || key0 === "persona_presets")) {
					validate276.errors = [{
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
							validate276.errors = [{
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
						if (data.data_generation_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.data_generation_id !== "string") {
								validate276.errors = [{
									instancePath: instancePath + "/data_generation_id",
									schemaPath: "#/properties/data_generation_id/type",
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
											validate276.errors = [{
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate276.errors = [{
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate276.errors = [{
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
												if (!validate277(data3[i0], {
													instancePath: instancePath + "/model_profiles/" + i0,
													parentData: data3,
													parentDataProperty: i0,
													rootData,
													dynamicAnchors
												})) {
													vErrors = vErrors === null ? validate277.errors : vErrors.concat(validate277.errors);
													errors = vErrors.length;
												}
												if (!(_errs11 === errors)) break;
											}
										} else {
											validate276.errors = [{
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
													if (!validate279(data5[i1], {
														instancePath: instancePath + "/persona_presets/" + i1,
														parentData: data5,
														parentDataProperty: i1,
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate279.errors : vErrors.concat(validate279.errors);
														errors = vErrors.length;
													}
													if (!(_errs14 === errors)) break;
												}
											} else {
												validate276.errors = [{
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
								}
							}
						}
					}
				}
			}
		} else {
			validate276.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate276.errors = vErrors;
	return errors === 0;
}
validate276.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateGlobalConfigurationSaveRequest };
