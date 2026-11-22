import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateDevelopmentModelImportResponse.js
var validateDevelopmentModelImportResponse = validate189;
var schema258 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema252 = {
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	],
	"type": "string"
};
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate192(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate192.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.revision === void 0 && (missing0 = "revision") || data.credential_configured === void 0 && (missing0 = "credential_configured")) {
			validate192.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "base_url" || key0 === "credential_configured" || key0 === "id" || key0 === "model_name" || key0 === "name" || key0 === "protocol" || key0 === "revision")) {
				validate192.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.base_url !== void 0) {
				if (typeof data.base_url !== "string") {
					validate192.errors = [{
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
				if (data.credential_configured !== void 0) {
					if (typeof data.credential_configured !== "boolean") {
						validate192.errors = [{
							instancePath: instancePath + "/credential_configured",
							schemaPath: "#/properties/credential_configured/type",
							keyword: "type",
							params: { type: "boolean" },
							message: "must be boolean"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.id !== void 0) {
						if (typeof data.id !== "string") {
							validate192.errors = [{
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
							if (typeof data.model_name !== "string") {
								validate192.errors = [{
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
								if (typeof data.name !== "string") {
									validate192.errors = [{
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
									let data5 = data.protocol;
									if (typeof data5 !== "string") {
										validate192.errors = [{
											instancePath: instancePath + "/protocol",
											schemaPath: "#/$defs/ModelProtocol/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									if (!(data5 === "openai_chat_completions" || data5 === "anthropic_messages" || data5 === "openai_responses")) {
										validate192.errors = [{
											instancePath: instancePath + "/protocol",
											schemaPath: "#/$defs/ModelProtocol/enum",
											keyword: "enum",
											params: { allowedValues: schema252.enum },
											message: "must be equal to one of the allowed values"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.revision !== void 0) {
										let data6 = data.revision;
										if (typeof data6 === "string") {
											if (func2(data6) > 19) {
												validate192.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												}];
												return false;
											} else if (!pattern4.test(data6)) {
												validate192.errors = [{
													instancePath: instancePath + "/revision",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												}];
												return false;
											}
										} else {
											validate192.errors = [{
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
		validate192.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate192.errors = vErrors;
	return true;
}
validate192.evaluated = {
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
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.language_style === void 0 && (missing0 = "language_style") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.revision === void 0 && (missing0 = "revision")) {
			validate194.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "dimensions" || key0 === "id" || key0 === "language_style" || key0 === "name" || key0 === "revision" || key0 === "skill")) {
				validate194.errors = [{
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
						validate194.errors = [{
							instancePath: instancePath + "/dimensions",
							schemaPath: "#/$defs/PersonaDimensions/required",
							keyword: "required",
							params: { missingProperty: missing1 },
							message: "must have required property '" + missing1 + "'"
						}];
						return false;
					} else {
						for (const key1 in data0) if (!(key1 === "activity" || key1 === "casual" || key1 === "direct" || key1 === "empathy" || key1 === "formal" || key1 === "humor" || key1 === "professional" || key1 === "social_energy")) {
							validate194.errors = [{
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
								validate194.errors = [{
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
									validate194.errors = [{
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
									validate194.errors = [{
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
									validate194.errors = [{
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
									} else if (data2 < 0 || isNaN(data2)) {
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
								var valid2 = true;
							} else var valid2 = true;
							if (valid2) {
								if (data0.direct !== void 0) {
									let data3 = data0.direct;
									if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
										validate194.errors = [{
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
										} else if (data3 < 0 || isNaN(data3)) {
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
									var valid2 = true;
								} else var valid2 = true;
								if (valid2) {
									if (data0.empathy !== void 0) {
										let data4 = data0.empathy;
										if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
											validate194.errors = [{
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
											} else if (data4 < 0 || isNaN(data4)) {
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
										var valid2 = true;
									} else var valid2 = true;
									if (valid2) {
										if (data0.formal !== void 0) {
											let data5 = data0.formal;
											if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5))) {
												validate194.errors = [{
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
												} else if (data5 < 0 || isNaN(data5)) {
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
											var valid2 = true;
										} else var valid2 = true;
										if (valid2) {
											if (data0.humor !== void 0) {
												let data6 = data0.humor;
												if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
													validate194.errors = [{
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
													} else if (data6 < 0 || isNaN(data6)) {
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
												var valid2 = true;
											} else var valid2 = true;
											if (valid2) {
												if (data0.professional !== void 0) {
													let data7 = data0.professional;
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
													var valid2 = true;
												} else var valid2 = true;
												if (valid2) {
													if (data0.social_energy !== void 0) {
														let data8 = data0.social_energy;
														if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
															validate194.errors = [{
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
															} else if (data8 < 0 || isNaN(data8)) {
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
							if (data.revision !== void 0) {
								let data12 = data.revision;
								if (typeof data12 === "string") {
									if (func2(data12) > 19) {
										validate194.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data12)) {
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
function validate191(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate191.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.revision === void 0 && (missing0 = "revision") || data.model_profiles === void 0 && (missing0 = "model_profiles") || data.persona_presets === void 0 && (missing0 = "persona_presets")) {
				validate191.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "model_profiles" || key0 === "persona_presets" || key0 === "revision")) {
					validate191.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.model_profiles !== void 0) {
						let data0 = data.model_profiles;
						const _errs2 = errors;
						if (errors === _errs2) {
							if (Array.isArray(data0)) {
								const len0 = data0.length;
								for (let i0 = 0; i0 < len0; i0++) {
									const _errs4 = errors;
									if (!validate192(data0[i0], {
										instancePath: instancePath + "/model_profiles/" + i0,
										parentData: data0,
										parentDataProperty: i0,
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate192.errors : vErrors.concat(validate192.errors);
										errors = vErrors.length;
									}
									if (!(_errs4 === errors)) break;
								}
							} else {
								validate191.errors = [{
									instancePath: instancePath + "/model_profiles",
									schemaPath: "#/properties/model_profiles/type",
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
						if (data.persona_presets !== void 0) {
							let data2 = data.persona_presets;
							const _errs5 = errors;
							if (errors === _errs5) {
								if (Array.isArray(data2)) {
									const len1 = data2.length;
									for (let i1 = 0; i1 < len1; i1++) {
										const _errs7 = errors;
										if (!validate194(data2[i1], {
											instancePath: instancePath + "/persona_presets/" + i1,
											parentData: data2,
											parentDataProperty: i1,
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate194.errors : vErrors.concat(validate194.errors);
											errors = vErrors.length;
										}
										if (!(_errs7 === errors)) break;
									}
								} else {
									validate191.errors = [{
										instancePath: instancePath + "/persona_presets",
										schemaPath: "#/properties/persona_presets/type",
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
							if (data.revision !== void 0) {
								let data4 = data.revision;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data4 === "string") {
										if (func2(data4) > 19) {
											validate191.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data4)) {
											validate191.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate191.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
								}
								var valid0 = _errs8 === errors;
							} else var valid0 = true;
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
	}
	validate191.errors = vErrors;
	return errors === 0;
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
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
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
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
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
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate191(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate191.errors : vErrors.concat(validate191.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate190.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate190.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema258.enum },
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
var schema260 = {
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
var schema261 = {
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
var schema262 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
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
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
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
						params: { allowedValues: schema261.enum },
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
						validate199.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema260.properties.field_path.type },
							message: "must be string,null"
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
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate199.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate199.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema262.enum },
										message: "must be equal to one of the allowed values"
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
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
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
					if (data.error !== void 0) {
						const _errs2 = errors;
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
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate198.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate198.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema258.enum },
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
function validate189(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate189.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate190(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate190.errors : vErrors.concat(validate190.errors);
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
		validate189.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate189.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate189.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateDevelopmentModelImportResponse };
