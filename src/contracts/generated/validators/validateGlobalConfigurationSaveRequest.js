import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateGlobalConfigurationSaveRequest.js
var validateGlobalConfigurationSaveRequest = validate232;
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
var schema315 = {
	"enum": [
		"openai_chat_completions",
		"anthropic_messages",
		"openai_responses"
	],
	"type": "string"
};
var schema314 = {
	"enum": ["off", "enabled"],
	"type": "string"
};
function validate234(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate234.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.temperature === void 0 && (missing0 = "temperature") || data.top_p === void 0 && (missing0 = "top_p") || data.max_output_tokens === void 0 && (missing0 = "max_output_tokens") || data.input_budget === void 0 && (missing0 = "input_budget") || data.reasoning === void 0 && (missing0 = "reasoning")) {
			validate234.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "input_budget" || key0 === "max_output_tokens" || key0 === "reasoning" || key0 === "temperature" || key0 === "top_p")) {
				validate234.errors = [{
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
					validate234.errors = [{
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
						validate234.errors = [{
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
						validate234.errors = [{
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
						validate234.errors = [{
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
							validate234.errors = [{
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
							validate234.errors = [{
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
							validate234.errors = [{
								instancePath: instancePath + "/reasoning",
								schemaPath: "#/$defs/ReasoningMode/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "off" || data2 === "enabled")) {
							validate234.errors = [{
								instancePath: instancePath + "/reasoning",
								schemaPath: "#/$defs/ReasoningMode/enum",
								keyword: "enum",
								params: { allowedValues: schema314.enum },
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
									validate234.errors = [{
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
									validate234.errors = [{
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
								validate234.errors = [{
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
										validate234.errors = [{
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
										validate234.errors = [{
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
									validate234.errors = [{
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
function validate233(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate233.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.protocol === void 0 && (missing0 = "protocol") || data.base_url === void 0 && (missing0 = "base_url") || data.model_name === void 0 && (missing0 = "model_name") || data.parameters === void 0 && (missing0 = "parameters")) {
				validate233.errors = [{
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
					validate233.errors = [{
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
									validate233.errors = [{
										instancePath: instancePath + "/base_url",
										schemaPath: "#/properties/base_url/maxLength",
										keyword: "maxLength",
										params: { limit: 2048 },
										message: "must NOT have more than 2048 characters"
									}];
									return false;
								}
							} else {
								validate233.errors = [{
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
								validate233.errors = [{
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
											validate233.errors = [{
												instancePath: instancePath + "/model_name",
												schemaPath: "#/properties/model_name/maxLength",
												keyword: "maxLength",
												params: { limit: 200 },
												message: "must NOT have more than 200 characters"
											}];
											return false;
										}
									} else {
										validate233.errors = [{
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
												validate233.errors = [{
													instancePath: instancePath + "/name",
													schemaPath: "#/properties/name/maxLength",
													keyword: "maxLength",
													params: { limit: 80 },
													message: "must NOT have more than 80 characters"
												}];
												return false;
											} else if (func2(data3) < 1) {
												validate233.errors = [{
													instancePath: instancePath + "/name",
													schemaPath: "#/properties/name/minLength",
													keyword: "minLength",
													params: { limit: 1 },
													message: "must NOT have fewer than 1 characters"
												}];
												return false;
											}
										} else {
											validate233.errors = [{
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
										if (!validate234(data.parameters, {
											instancePath: instancePath + "/parameters",
											parentData: data,
											parentDataProperty: "parameters",
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
											errors = vErrors.length;
										}
										var valid0 = _errs10 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.protocol !== void 0) {
											let data5 = data.protocol;
											const _errs11 = errors;
											if (typeof data5 !== "string") {
												validate233.errors = [{
													instancePath: instancePath + "/protocol",
													schemaPath: "#/$defs/ModelProtocol/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											if (!(data5 === "openai_chat_completions" || data5 === "anthropic_messages" || data5 === "openai_responses")) {
												validate233.errors = [{
													instancePath: instancePath + "/protocol",
													schemaPath: "#/$defs/ModelProtocol/enum",
													keyword: "enum",
													params: { allowedValues: schema315.enum },
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
			validate233.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate233.errors = vErrors;
	return errors === 0;
}
validate233.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate237(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate237.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.language_style === void 0 && (missing0 = "language_style") || data.address_terms === void 0 && (missing0 = "address_terms") || data.skill === void 0 && (missing0 = "skill") || data.dimensions === void 0 && (missing0 = "dimensions") || data.revision === void 0 && (missing0 = "revision")) {
			validate237.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "address_terms" || key0 === "dimensions" || key0 === "id" || key0 === "language_style" || key0 === "name" || key0 === "revision" || key0 === "skill")) {
				validate237.errors = [{
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
						validate237.errors = [{
							instancePath: instancePath + "/address_terms/" + i0,
							schemaPath: "#/properties/address_terms/items/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
				} else {
					validate237.errors = [{
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
							validate237.errors = [{
								instancePath: instancePath + "/dimensions",
								schemaPath: "#/$defs/PersonaDimensions/required",
								keyword: "required",
								params: { missingProperty: missing1 },
								message: "must have required property '" + missing1 + "'"
							}];
							return false;
						} else {
							for (const key1 in data2) if (!(key1 === "activity" || key1 === "casual" || key1 === "direct" || key1 === "empathy" || key1 === "formal" || key1 === "humor" || key1 === "professional" || key1 === "social_energy")) {
								validate237.errors = [{
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
									validate237.errors = [{
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
										validate237.errors = [{
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
										validate237.errors = [{
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
										validate237.errors = [{
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
											validate237.errors = [{
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
											validate237.errors = [{
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
											validate237.errors = [{
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
												validate237.errors = [{
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
												validate237.errors = [{
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
												validate237.errors = [{
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
													validate237.errors = [{
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
													validate237.errors = [{
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
													validate237.errors = [{
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
														validate237.errors = [{
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
														validate237.errors = [{
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
														validate237.errors = [{
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
															validate237.errors = [{
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
															validate237.errors = [{
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
															validate237.errors = [{
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
																validate237.errors = [{
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
																validate237.errors = [{
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
																validate237.errors = [{
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
																	validate237.errors = [{
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
																	validate237.errors = [{
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
						validate237.errors = [{
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
							validate237.errors = [{
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
								validate237.errors = [{
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
									validate237.errors = [{
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
											validate237.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data14)) {
											validate237.errors = [{
												instancePath: instancePath + "/revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate237.errors = [{
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
											validate237.errors = [{
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
		validate237.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate237.errors = vErrors;
	return true;
}
validate237.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate232(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate232.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.model_profiles === void 0 && (missing0 = "model_profiles") || data.persona_presets === void 0 && (missing0 = "persona_presets") || data.runtime_defaults === void 0 && (missing0 = "runtime_defaults")) {
				validate232.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "expected_revision" || key0 === "model_profiles" || key0 === "persona_presets" || key0 === "runtime_defaults")) {
					validate232.errors = [{
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
							validate232.errors = [{
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
								validate232.errors = [{
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
											validate232.errors = [{
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate232.errors = [{
												instancePath: instancePath + "/expected_revision",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate232.errors = [{
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
												if (!validate233(data3[i0], {
													instancePath: instancePath + "/model_profiles/" + i0,
													parentData: data3,
													parentDataProperty: i0,
													rootData,
													dynamicAnchors
												})) {
													vErrors = vErrors === null ? validate233.errors : vErrors.concat(validate233.errors);
													errors = vErrors.length;
												}
												if (!(_errs11 === errors)) break;
											}
										} else {
											validate232.errors = [{
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
													if (!validate237(data5[i1], {
														instancePath: instancePath + "/persona_presets/" + i1,
														parentData: data5,
														parentDataProperty: i1,
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate237.errors : vErrors.concat(validate237.errors);
														errors = vErrors.length;
													}
													if (!(_errs14 === errors)) break;
												}
											} else {
												validate232.errors = [{
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
														validate232.errors = [{
															instancePath: instancePath + "/runtime_defaults",
															schemaPath: "#/$defs/AgentPreferences/required",
															keyword: "required",
															params: { missingProperty: missing1 },
															message: "must have required property '" + missing1 + "'"
														}];
														return false;
													} else {
														const _errs18 = errors;
														for (const key1 in data7) if (!(key1 === "allow_autonomous_wake" || key1 === "persistent_memory" || key1 === "request_limit_daily")) {
															validate232.errors = [{
																instancePath: instancePath + "/runtime_defaults",
																schemaPath: "#/$defs/AgentPreferences/additionalProperties",
																keyword: "additionalProperties",
																params: { additionalProperty: key1 },
																message: "must NOT have additional properties"
															}];
															return false;
														}
														if (_errs18 === errors) {
															if (data7.allow_autonomous_wake !== void 0) {
																const _errs19 = errors;
																if (typeof data7.allow_autonomous_wake !== "boolean") {
																	validate232.errors = [{
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
															if (valid5) {
																if (data7.persistent_memory !== void 0) {
																	const _errs21 = errors;
																	if (typeof data7.persistent_memory !== "boolean") {
																		validate232.errors = [{
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
																	if (data7.request_limit_daily !== void 0) {
																		let data10 = data7.request_limit_daily;
																		const _errs23 = errors;
																		if (!(typeof data10 == "number" && !(data10 % 1) && !isNaN(data10) && isFinite(data10))) {
																			validate232.errors = [{
																				instancePath: instancePath + "/runtime_defaults/request_limit_daily",
																				schemaPath: "#/$defs/AgentPreferences/properties/request_limit_daily/type",
																				keyword: "type",
																				params: { type: "integer" },
																				message: "must be integer"
																			}];
																			return false;
																		}
																		if (errors === _errs23) {
																			if (typeof data10 == "number" && isFinite(data10)) {
																				if (data10 > 5e3 || isNaN(data10)) {
																					validate232.errors = [{
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
																				} else if (data10 < 1 || isNaN(data10)) {
																					validate232.errors = [{
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
																		var valid5 = _errs23 === errors;
																	} else var valid5 = true;
																}
															}
														}
													}
												} else {
													validate232.errors = [{
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
			validate232.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate232.errors = vErrors;
	return errors === 0;
}
validate232.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateGlobalConfigurationSaveRequest };
