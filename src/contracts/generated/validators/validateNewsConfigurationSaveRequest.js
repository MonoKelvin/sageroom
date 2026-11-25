import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateNewsConfigurationSaveRequest.js
var validateNewsConfigurationSaveRequest = validate398;
var schema516 = {
	"description": "联网新闻来源。API Key 独立存放在系统凭据库，配置中不包含密钥。",
	"enum": [
		"auto",
		"google_news_rss",
		"ai_hot",
		"free_news_trending",
		"gdelt",
		"bbc_technology",
		"any_search",
		"tavily",
		"serper"
	],
	"type": "string"
};
var schema517 = {
	"enum": [
		"system",
		"direct",
		"manual"
	],
	"type": "string"
};
var func2 = require_ucs2length().default;
function validate399(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate399.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.enabled === void 0 && (missing0 = "enabled") || data.provider === void 0 && (missing0 = "provider") || data.refresh_minutes === void 0 && (missing0 = "refresh_minutes") || data.max_items === void 0 && (missing0 = "max_items")) {
			validate399.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "enabled" || key0 === "max_items" || key0 === "provider" || key0 === "proxy_enabled" || key0 === "proxy_mode" || key0 === "proxy_url" || key0 === "refresh_minutes")) {
				validate399.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.enabled !== void 0) {
				if (typeof data.enabled !== "boolean") {
					validate399.errors = [{
						instancePath: instancePath + "/enabled",
						schemaPath: "#/properties/enabled/type",
						keyword: "type",
						params: { type: "boolean" },
						message: "must be boolean"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.max_items !== void 0) {
					let data1 = data.max_items;
					if (!(typeof data1 == "number" && !(data1 % 1) && !isNaN(data1) && isFinite(data1))) {
						validate399.errors = [{
							instancePath: instancePath + "/max_items",
							schemaPath: "#/properties/max_items/type",
							keyword: "type",
							params: { type: "integer" },
							message: "must be integer"
						}];
						return false;
					}
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 8 || isNaN(data1)) {
							validate399.errors = [{
								instancePath: instancePath + "/max_items",
								schemaPath: "#/properties/max_items/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 8
								},
								message: "must be <= 8"
							}];
							return false;
						} else if (data1 < 1 || isNaN(data1)) {
							validate399.errors = [{
								instancePath: instancePath + "/max_items",
								schemaPath: "#/properties/max_items/minimum",
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
					if (data.provider !== void 0) {
						let data2 = data.provider;
						if (typeof data2 !== "string") {
							validate399.errors = [{
								instancePath: instancePath + "/provider",
								schemaPath: "#/$defs/NewsProvider/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "auto" || data2 === "google_news_rss" || data2 === "ai_hot" || data2 === "free_news_trending" || data2 === "gdelt" || data2 === "bbc_technology" || data2 === "any_search" || data2 === "tavily" || data2 === "serper")) {
							validate399.errors = [{
								instancePath: instancePath + "/provider",
								schemaPath: "#/$defs/NewsProvider/enum",
								keyword: "enum",
								params: { allowedValues: schema516.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.proxy_enabled !== void 0) {
							if (typeof data.proxy_enabled !== "boolean") {
								validate399.errors = [{
									instancePath: instancePath + "/proxy_enabled",
									schemaPath: "#/properties/proxy_enabled/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.proxy_mode !== void 0) {
								let data4 = data.proxy_mode;
								if (typeof data4 !== "string") {
									validate399.errors = [{
										instancePath: instancePath + "/proxy_mode",
										schemaPath: "#/$defs/NewsProxyMode/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "system" || data4 === "direct" || data4 === "manual")) {
									validate399.errors = [{
										instancePath: instancePath + "/proxy_mode",
										schemaPath: "#/$defs/NewsProxyMode/enum",
										keyword: "enum",
										params: { allowedValues: schema517.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.proxy_url !== void 0) {
									let data5 = data.proxy_url;
									if (typeof data5 === "string") {
										if (func2(data5) > 200) {
											validate399.errors = [{
												instancePath: instancePath + "/proxy_url",
												schemaPath: "#/properties/proxy_url/maxLength",
												keyword: "maxLength",
												params: { limit: 200 },
												message: "must NOT have more than 200 characters"
											}];
											return false;
										}
									} else {
										validate399.errors = [{
											instancePath: instancePath + "/proxy_url",
											schemaPath: "#/properties/proxy_url/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.refresh_minutes !== void 0) {
										let data6 = data.refresh_minutes;
										if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6))) {
											validate399.errors = [{
												instancePath: instancePath + "/refresh_minutes",
												schemaPath: "#/properties/refresh_minutes/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (typeof data6 == "number" && isFinite(data6)) {
											if (data6 > 720 || isNaN(data6)) {
												validate399.errors = [{
													instancePath: instancePath + "/refresh_minutes",
													schemaPath: "#/properties/refresh_minutes/maximum",
													keyword: "maximum",
													params: {
														comparison: "<=",
														limit: 720
													},
													message: "must be <= 720"
												}];
												return false;
											} else if (data6 < 5 || isNaN(data6)) {
												validate399.errors = [{
													instancePath: instancePath + "/refresh_minutes",
													schemaPath: "#/properties/refresh_minutes/minimum",
													keyword: "minimum",
													params: {
														comparison: ">=",
														limit: 5
													},
													message: "must be >= 5"
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
		validate399.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate399.errors = vErrors;
	return true;
}
validate399.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate398(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate398.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.configuration === void 0 && (missing0 = "configuration")) {
				validate398.errors = [{
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
					validate398.errors = [{
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
							validate398.errors = [{
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
							if (!validate399(data.configuration, {
								instancePath: instancePath + "/configuration",
								parentData: data,
								parentDataProperty: "configuration",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate399.errors : vErrors.concat(validate399.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.data_generation_id !== void 0) {
								const _errs5 = errors;
								if (typeof data.data_generation_id !== "string") {
									validate398.errors = [{
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
									if (errors === errors) {
										if (typeof data3 === "string") {
											if (func2(data3) > 19) {
												validate398.errors = [{
													instancePath: instancePath + "/expected_revision",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												}];
												return false;
											} else if (!pattern4.test(data3)) {
												validate398.errors = [{
													instancePath: instancePath + "/expected_revision",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												}];
												return false;
											}
										} else {
											validate398.errors = [{
												instancePath: instancePath + "/expected_revision",
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
							}
						}
					}
				}
			}
		} else {
			validate398.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate398.errors = vErrors;
	return errors === 0;
}
validate398.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateNewsConfigurationSaveRequest };
