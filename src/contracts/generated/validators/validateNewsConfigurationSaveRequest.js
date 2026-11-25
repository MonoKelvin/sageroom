import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateNewsConfigurationSaveRequest.js
var validateNewsConfigurationSaveRequest = validate340;
var schema443 = {
	"description": "联网新闻来源。仅接入无需 API Key 的公开源，避免把密钥写进配置库。",
	"enum": ["google_news_rss", "free_news_trending"],
	"type": "string"
};
var func2 = require_ucs2length().default;
function validate341(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate341.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.enabled === void 0 && (missing0 = "enabled") || data.provider === void 0 && (missing0 = "provider") || data.query === void 0 && (missing0 = "query") || data.refresh_minutes === void 0 && (missing0 = "refresh_minutes") || data.max_items === void 0 && (missing0 = "max_items")) {
			validate341.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "enabled" || key0 === "max_items" || key0 === "provider" || key0 === "query" || key0 === "refresh_minutes")) {
				validate341.errors = [{
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
					validate341.errors = [{
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
						validate341.errors = [{
							instancePath: instancePath + "/max_items",
							schemaPath: "#/properties/max_items/type",
							keyword: "type",
							params: { type: "integer" },
							message: "must be integer"
						}];
						return false;
					}
					if (typeof data1 == "number" && isFinite(data1)) {
						if (data1 > 255 || isNaN(data1)) {
							validate341.errors = [{
								instancePath: instancePath + "/max_items",
								schemaPath: "#/properties/max_items/maximum",
								keyword: "maximum",
								params: {
									comparison: "<=",
									limit: 255
								},
								message: "must be <= 255"
							}];
							return false;
						} else if (data1 < 0 || isNaN(data1)) {
							validate341.errors = [{
								instancePath: instancePath + "/max_items",
								schemaPath: "#/properties/max_items/minimum",
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
					if (data.provider !== void 0) {
						let data2 = data.provider;
						if (typeof data2 !== "string") {
							validate341.errors = [{
								instancePath: instancePath + "/provider",
								schemaPath: "#/$defs/NewsProvider/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "google_news_rss" || data2 === "free_news_trending")) {
							validate341.errors = [{
								instancePath: instancePath + "/provider",
								schemaPath: "#/$defs/NewsProvider/enum",
								keyword: "enum",
								params: { allowedValues: schema443.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.query !== void 0) {
							let data3 = data.query;
							if (typeof data3 === "string") {
								if (func2(data3) > 80) {
									validate341.errors = [{
										instancePath: instancePath + "/query",
										schemaPath: "#/properties/query/maxLength",
										keyword: "maxLength",
										params: { limit: 80 },
										message: "must NOT have more than 80 characters"
									}];
									return false;
								}
							} else {
								validate341.errors = [{
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
							if (data.refresh_minutes !== void 0) {
								let data4 = data.refresh_minutes;
								if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
									validate341.errors = [{
										instancePath: instancePath + "/refresh_minutes",
										schemaPath: "#/properties/refresh_minutes/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (typeof data4 == "number" && isFinite(data4)) {
									if (data4 < 0 || isNaN(data4)) {
										validate341.errors = [{
											instancePath: instancePath + "/refresh_minutes",
											schemaPath: "#/properties/refresh_minutes/minimum",
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
	} else {
		validate341.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate341.errors = vErrors;
	return true;
}
validate341.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate340(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate340.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.configuration === void 0 && (missing0 = "configuration")) {
				validate340.errors = [{
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
					validate340.errors = [{
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
							validate340.errors = [{
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
							if (!validate341(data.configuration, {
								instancePath: instancePath + "/configuration",
								parentData: data,
								parentDataProperty: "configuration",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate341.errors : vErrors.concat(validate341.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.data_generation_id !== void 0) {
								const _errs5 = errors;
								if (typeof data.data_generation_id !== "string") {
									validate340.errors = [{
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
												validate340.errors = [{
													instancePath: instancePath + "/expected_revision",
													schemaPath: "#/$defs/DecimalString/maxLength",
													keyword: "maxLength",
													params: { limit: 19 },
													message: "must NOT have more than 19 characters"
												}];
												return false;
											} else if (!pattern4.test(data3)) {
												validate340.errors = [{
													instancePath: instancePath + "/expected_revision",
													schemaPath: "#/$defs/DecimalString/pattern",
													keyword: "pattern",
													params: { pattern: "^(0|[1-9][0-9]*)$" },
													message: "must match pattern \"^(0|[1-9][0-9]*)$\""
												}];
												return false;
											}
										} else {
											validate340.errors = [{
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
			validate340.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate340.errors = vErrors;
	return errors === 0;
}
validate340.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateNewsConfigurationSaveRequest };
