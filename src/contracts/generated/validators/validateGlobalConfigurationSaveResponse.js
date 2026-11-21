import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateGlobalConfigurationSaveResponse.js
var validateGlobalConfigurationSaveResponse = validate239;
var schema333 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema326 = {
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	],
	"type": "string"
};
var schema325 = {
	"enum": ["off", "enabled"],
	"type": "string"
};
function validate243(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate243.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate243.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "input_budget" || key0 === "max_output_tokens" || key0 === "reasoning" || key0 === "temperature" || key0 === "top_p")) {
				validate243.errors = [{
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
					validate243.errors = [{
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
						validate243.errors = [{
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
						validate243.errors = [{
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
						validate243.errors = [{
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
							validate243.errors = [{
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
							validate243.errors = [{
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
							validate243.errors = [{
								instancePath: instancePath + "/reasoning",
								schemaPath: "#/$defs/ReasoningMode/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "off" || data2 === "enabled")) {
							validate243.errors = [{
								instancePath: instancePath + "/reasoning",
								schemaPath: "#/$defs/ReasoningMode/enum",
								keyword: "enum",
								params: { allowedValues: schema325.enum },
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
									validate243.errors = [{
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
									validate243.errors = [{
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
								validate243.errors = [{
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
										validate243.errors = [{
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
										validate243.errors = [{
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
									validate243.errors = [{
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
		validate243.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate243.errors = vErrors;
	return true;
}
validate243.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate242(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate242.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters") || data.revision === void 0 && (missing0 = "revision") || data.credential_configured === void 0 && (missing0 = "credential_configured")) {
				validate242.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "base_url" || key0 === "credential_configured" || key0 === "id" || key0 === "model_name" || key0 === "name" || key0 === "parameters" || key0 === "protocol" || key0 === "revision")) {
					validate242.errors = [{
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
						const _errs2 = errors;
						if (typeof data.base_url !== "string") {
							validate242.errors = [{
								instancePath: instancePath + "/base_url",
								schemaPath: "#/properties/base_url/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.credential_configured !== void 0) {
							const _errs4 = errors;
							if (typeof data.credential_configured !== "boolean") {
								validate242.errors = [{
									instancePath: instancePath + "/credential_configured",
									schemaPath: "#/properties/credential_configured/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.id !== void 0) {
								const _errs6 = errors;
								if (typeof data.id !== "string") {
									validate242.errors = [{
										instancePath: instancePath + "/id",
										schemaPath: "#/properties/id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.model_name !== void 0) {
									const _errs8 = errors;
									if (typeof data.model_name !== "string") {
										validate242.errors = [{
											instancePath: instancePath + "/model_name",
											schemaPath: "#/properties/model_name/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.name !== void 0) {
										const _errs10 = errors;
										if (typeof data.name !== "string") {
											validate242.errors = [{
												instancePath: instancePath + "/name",
												schemaPath: "#/properties/name/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = _errs10 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.parameters !== void 0) {
											const _errs12 = errors;
											if (!validate243(data.parameters, {
												instancePath: instancePath + "/parameters",
												parentData: data,
												parentDataProperty: "parameters",
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate243.errors : vErrors.concat(validate243.errors);
												errors = vErrors.length;
											}
											var valid0 = _errs12 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.protocol !== void 0) {
												let data6 = data.protocol;
												const _errs13 = errors;
												if (typeof data6 !== "string") {
													validate242.errors = [{
														instancePath: instancePath + "/protocol",
														schemaPath: "#/$defs/ModelProtocol/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												if (!(data6 === "openai_chat_completions" || data6 === "anthropic_messages" || data6 === "openai_responses")) {
													validate242.errors = [{
														instancePath: instancePath + "/protocol",
														schemaPath: "#/$defs/ModelProtocol/enum",
														keyword: "enum",
														params: { allowedValues: schema326.enum },
														message: "must be equal to one of the allowed values"
													}];
													return false;
												}
												var valid0 = _errs13 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.revision !== void 0) {
													let data7 = data.revision;
													const _errs16 = errors;
													if (errors === errors) {
														if (typeof data7 === "string") {
															if (func2(data7) > 19) {
																validate242.errors = [{
																	instancePath: instancePath + "/revision",
																	schemaPath: "#/$defs/DecimalString/maxLength",
																	keyword: "maxLength",
																	params: { limit: 19 },
																	message: "must NOT have more than 19 characters"
																}];
																return false;
															} else if (!pattern4.test(data7)) {
																validate242.errors = [{
																	instancePath: instancePath + "/revision",
																	schemaPath: "#/$defs/DecimalString/pattern",
																	keyword: "pattern",
																	params: { pattern: "^(0|[1-9][0-9]*)$" },
																	message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																}];
																return false;
															}
														} else {
															validate242.errors = [{
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
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
	}
	validate242.errors = vErrors;
	return errors === 0;
}
validate242.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate246(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate246.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.language_style === void 0 && (missing0 = "language_style") || data.address_terms === void 0 && (missing0 = "address_terms") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.revision === void 0 && (missing0 = "revision")) {
			validate246.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "address_terms" || key0 === "dimensions" || key0 === "id" || key0 === "language_style" || key0 === "name" || key0 === "revision" || key0 === "skill")) {
				validate246.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.address_terms !== void 0) {
				let data0 = data.address_terms;
				if (Array.isArray(data0)) {
					const len0 = data0.length;
					for (let i0 = 0; i0 < len0; i0++) if (typeof data0[i0] !== "string") {
						validate246.errors = [{
							instancePath: instancePath + "/address_terms/" + i0,
							schemaPath: "#/properties/address_terms/items/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
				} else {
					validate246.errors = [{
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
				if (data.dimensions !== void 0) {
					let data2 = data.dimensions;
					if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
						let missing1;
						if (data2.professional === void 0 && (missing1 = "professional") || data2.formal === void 0 && (missing1 = "formal") || data2.casual === void 0 && (missing1 = "casual") || data2.humor === void 0 && (missing1 = "humor") || data2.direct === void 0 && (missing1 = "direct") || data2.empathy === void 0 && (missing1 = "empathy") || data2.social_energy === void 0 && (missing1 = "social_energy") || data2.activity === void 0 && (missing1 = "activity")) {
							validate246.errors = [{
								instancePath: instancePath + "/dimensions",
								schemaPath: "#/$defs/PersonaDimensions/required",
								keyword: "required",
								params: { missingProperty: missing1 },
								message: "must have required property '" + missing1 + "'"
							}];
							return false;
						} else {
							for (const key1 in data2) if (!(key1 === "activity" || key1 === "casual" || key1 === "direct" || key1 === "empathy" || key1 === "formal" || key1 === "humor" || key1 === "professional" || key1 === "social_energy")) {
								validate246.errors = [{
									instancePath: instancePath + "/dimensions",
									schemaPath: "#/$defs/PersonaDimensions/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key1 },
									message: "must NOT have additional properties"
								}];
								return false;
							}
							if (data2.activity !== void 0) {
								let data3 = data2.activity;
								if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
									validate246.errors = [{
										instancePath: instancePath + "/dimensions/activity",
										schemaPath: "#/$defs/PersonaDimensions/properties/activity/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (typeof data3 == "number" && isFinite(data3)) {
									if (data3 > 100 || isNaN(data3)) {
										validate246.errors = [{
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
									} else if (data3 < 0 || isNaN(data3)) {
										validate246.errors = [{
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
								var valid3 = true;
							} else var valid3 = true;
							if (valid3) {
								if (data2.casual !== void 0) {
									let data4 = data2.casual;
									if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
										validate246.errors = [{
											instancePath: instancePath + "/dimensions/casual",
											schemaPath: "#/$defs/PersonaDimensions/properties/casual/type",
											keyword: "type",
											params: { type: "integer" },
											message: "must be integer"
										}];
										return false;
									}
									if (typeof data4 == "number" && isFinite(data4)) {
										if (data4 > 100 || isNaN(data4)) {
											validate246.errors = [{
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
										} else if (data4 < 0 || isNaN(data4)) {
											validate246.errors = [{
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
									if (data2.direct !== void 0) {
										let data5 = data2.direct;
										if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5))) {
											validate246.errors = [{
												instancePath: instancePath + "/dimensions/direct",
												schemaPath: "#/$defs/PersonaDimensions/properties/direct/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (typeof data5 == "number" && isFinite(data5)) {
											if (data5 > 100 || isNaN(data5)) {
												validate246.errors = [{
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
											} else if (data5 < 0 || isNaN(data5)) {
												validate246.errors = [{
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
										if (data2.empathy !== void 0) {
											let data6 = data2.empathy;
											if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
												validate246.errors = [{
													instancePath: instancePath + "/dimensions/empathy",
													schemaPath: "#/$defs/PersonaDimensions/properties/empathy/type",
													keyword: "type",
													params: { type: "integer" },
													message: "must be integer"
												}];
												return false;
											}
											if (typeof data6 == "number" && isFinite(data6)) {
												if (data6 > 100 || isNaN(data6)) {
													validate246.errors = [{
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
												} else if (data6 < 0 || isNaN(data6)) {
													validate246.errors = [{
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
											if (data2.formal !== void 0) {
												let data7 = data2.formal;
												if (!(typeof data7 == "number" && !(data7 % 1) && !isNaN(data7) && isFinite(data7))) {
													validate246.errors = [{
														instancePath: instancePath + "/dimensions/formal",
														schemaPath: "#/$defs/PersonaDimensions/properties/formal/type",
														keyword: "type",
														params: { type: "integer" },
														message: "must be integer"
													}];
													return false;
												}
												if (typeof data7 == "number" && isFinite(data7)) {
													if (data7 > 100 || isNaN(data7)) {
														validate246.errors = [{
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
													} else if (data7 < 0 || isNaN(data7)) {
														validate246.errors = [{
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
												if (data2.humor !== void 0) {
													let data8 = data2.humor;
													if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
														validate246.errors = [{
															instancePath: instancePath + "/dimensions/humor",
															schemaPath: "#/$defs/PersonaDimensions/properties/humor/type",
															keyword: "type",
															params: { type: "integer" },
															message: "must be integer"
														}];
														return false;
													}
													if (typeof data8 == "number" && isFinite(data8)) {
														if (data8 > 100 || isNaN(data8)) {
															validate246.errors = [{
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
														} else if (data8 < 0 || isNaN(data8)) {
															validate246.errors = [{
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
													if (data2.professional !== void 0) {
														let data9 = data2.professional;
														if (!(typeof data9 == "number" && !(data9 % 1) && !isNaN(data9) && isFinite(data9))) {
															validate246.errors = [{
																instancePath: instancePath + "/dimensions/professional",
																schemaPath: "#/$defs/PersonaDimensions/properties/professional/type",
																keyword: "type",
																params: { type: "integer" },
																message: "must be integer"
															}];
															return false;
														}
														if (typeof data9 == "number" && isFinite(data9)) {
															if (data9 > 100 || isNaN(data9)) {
																validate246.errors = [{
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
															} else if (data9 < 0 || isNaN(data9)) {
																validate246.errors = [{
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
														if (data2.social_energy !== void 0) {
															let data10 = data2.social_energy;
															if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																validate246.errors = [{
																	instancePath: instancePath + "/dimensions/social_energy",
																	schemaPath: "#/$defs/PersonaDimensions/properties/social_energy/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																}];
																return false;
															}
															if (typeof data10 == "number" && isFinite(data10)) {
																if (data10 > 100 || isNaN(data10)) {
																	validate246.errors = [{
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
																} else if (data10 < 0 || isNaN(data10)) {
																	validate246.errors = [{
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
						}
					} else {
						validate246.errors = [{
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
							validate246.errors = [{
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
								validate246.errors = [{
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
									validate246.errors = [{
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
									let data14 = data.revision;
									if (typeof data14 === "string") {
										if (func2(data14) > 19) {
											validate246.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data14)) {
											validate246.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate246.errors = [{
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
											validate246.errors = [{
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
	validate246.errors = vErrors;
	return true;
}
validate246.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate241(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate241.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.revision === void 0 && (missing0 = "revision") || data.model_profiles === void 0 && (missing0 = "model_profiles") || data.persona_presets === void 0 && (missing0 = "persona_presets") || data.runtime_defaults === void 0 && (missing0 = "runtime_defaults")) {
				validate241.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "model_profiles" || key0 === "persona_presets" || key0 === "revision" || key0 === "runtime_defaults")) {
					validate241.errors = [{
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
									if (!validate242(data0[i0], {
										instancePath: instancePath + "/model_profiles/" + i0,
										parentData: data0,
										parentDataProperty: i0,
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate242.errors : vErrors.concat(validate242.errors);
										errors = vErrors.length;
									}
									if (!(_errs4 === errors)) break;
								}
							} else {
								validate241.errors = [{
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
										if (!validate246(data2[i1], {
											instancePath: instancePath + "/persona_presets/" + i1,
											parentData: data2,
											parentDataProperty: i1,
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate246.errors : vErrors.concat(validate246.errors);
											errors = vErrors.length;
										}
										if (!(_errs7 === errors)) break;
									}
								} else {
									validate241.errors = [{
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
											validate241.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data4)) {
											validate241.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate241.errors = [{
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
							if (valid0) {
								if (data.runtime_defaults !== void 0) {
									let data5 = data.runtime_defaults;
									const _errs11 = errors;
									if (errors === errors) {
										if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
											let missing1;
											if (data5.request_limit_daily === void 0 && (missing1 = "request_limit_daily") || data5.persistent_memory === void 0 && (missing1 = "persistent_memory") || data5.allow_autonomous_wake === void 0 && (missing1 = "allow_autonomous_wake")) {
												validate241.errors = [{
													instancePath: instancePath + "/runtime_defaults",
													schemaPath: "#/$defs/AgentPreferences/required",
													keyword: "required",
													params: { missingProperty: missing1 },
													message: "must have required property '" + missing1 + "'"
												}];
												return false;
											} else {
												const _errs14 = errors;
												for (const key1 in data5) if (!(key1 === "allow_autonomous_wake" || key1 === "persistent_memory" || key1 === "request_limit_daily")) {
													validate241.errors = [{
														instancePath: instancePath + "/runtime_defaults",
														schemaPath: "#/$defs/AgentPreferences/additionalProperties",
														keyword: "additionalProperties",
														params: { additionalProperty: key1 },
														message: "must NOT have additional properties"
													}];
													return false;
												}
												if (_errs14 === errors) {
													if (data5.allow_autonomous_wake !== void 0) {
														const _errs15 = errors;
														if (typeof data5.allow_autonomous_wake !== "boolean") {
															validate241.errors = [{
																instancePath: instancePath + "/runtime_defaults/allow_autonomous_wake",
																schemaPath: "#/$defs/AgentPreferences/properties/allow_autonomous_wake/type",
																keyword: "type",
																params: { type: "boolean" },
																message: "must be boolean"
															}];
															return false;
														}
														var valid5 = _errs15 === errors;
													} else var valid5 = true;
													if (valid5) {
														if (data5.persistent_memory !== void 0) {
															const _errs17 = errors;
															if (typeof data5.persistent_memory !== "boolean") {
																validate241.errors = [{
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
															if (data5.request_limit_daily !== void 0) {
																let data8 = data5.request_limit_daily;
																const _errs19 = errors;
																if (!(typeof data8 == "number" && !(data8 % 1) && !isNaN(data8) && isFinite(data8))) {
																	validate241.errors = [{
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
																			validate241.errors = [{
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
																			validate241.errors = [{
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
														}
													}
												}
											}
										} else {
											validate241.errors = [{
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
			validate241.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate241.errors = vErrors;
	return errors === 0;
}
validate241.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate240(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate240.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate240.errors = [{
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
					validate240.errors = [{
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
						if (!validate241(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate241.errors : vErrors.concat(validate241.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate240.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate240.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema333.enum },
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
			validate240.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate240.errors = vErrors;
	return errors === 0;
}
validate240.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema335 = {
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
var schema336 = {
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
var schema337 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate251(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate251.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate251.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate251.errors = [{
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
					validate251.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate251.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
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
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate251.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema335.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate251.errors = [{
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
								validate251.errors = [{
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
									validate251.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate251.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema337.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate251.errors = [{
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
		validate251.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate251.errors = vErrors;
	return true;
}
validate251.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate250(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate250.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate250.errors = [{
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
					validate250.errors = [{
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
						if (!validate251(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate251.errors : vErrors.concat(validate251.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate250.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate250.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema333.enum },
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
			validate250.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate250.errors = vErrors;
	return errors === 0;
}
validate250.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate239(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate239.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate240(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate240.errors : vErrors.concat(validate240.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate250(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate250.errors : vErrors.concat(validate250.errors);
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
		validate239.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate239.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate239.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateGlobalConfigurationSaveResponse };
