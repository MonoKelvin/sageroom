import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateChatSearchRequest.js
var validateChatSearchRequest = validate151;
var schema204 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"cursor": {
			"default": null,
			"type": ["string", "null"]
		},
		"data_generation_id": { "type": "string" },
		"limit": {
			"format": "uint32",
			"maximum": 200,
			"minimum": 1,
			"type": "integer"
		},
		"query": {
			"maxLength": 256,
			"minLength": 1,
			"type": "string"
		},
		"search_id": { "type": "string" }
	},
	"required": [
		"data_generation_id",
		"search_id",
		"query",
		"limit"
	],
	"title": "ChatSearchRequest",
	"type": "object"
};
var func2 = require_ucs2length().default;
function validate151(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate151.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id") || data.query === void 0 && (missing0 = "query") || data.limit === void 0 && (missing0 = "limit")) {
			validate151.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "cursor" || key0 === "data_generation_id" || key0 === "limit" || key0 === "query" || key0 === "search_id")) {
				validate151.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.cursor !== void 0) {
				let data0 = data.cursor;
				if (typeof data0 !== "string" && data0 !== null) {
					validate151.errors = [{
						instancePath: instancePath + "/cursor",
						schemaPath: "#/properties/cursor/type",
						keyword: "type",
						params: { type: schema204.properties.cursor.type },
						message: "must be string,null"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data_generation_id !== void 0) {
					if (typeof data.data_generation_id !== "string") {
						validate151.errors = [{
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
					if (data.limit !== void 0) {
						let data2 = data.limit;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate151.errors = [{
								instancePath: instancePath + "/limit",
								schemaPath: "#/properties/limit/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 200 || isNaN(data2)) {
								validate151.errors = [{
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
							} else if (data2 < 1 || isNaN(data2)) {
								validate151.errors = [{
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
					if (valid0) {
						if (data.query !== void 0) {
							let data3 = data.query;
							if (typeof data3 === "string") {
								if (func2(data3) > 256) {
									validate151.errors = [{
										instancePath: instancePath + "/query",
										schemaPath: "#/properties/query/maxLength",
										keyword: "maxLength",
										params: { limit: 256 },
										message: "must NOT have more than 256 characters"
									}];
									return false;
								} else if (func2(data3) < 1) {
									validate151.errors = [{
										instancePath: instancePath + "/query",
										schemaPath: "#/properties/query/minLength",
										keyword: "minLength",
										params: { limit: 1 },
										message: "must NOT have fewer than 1 characters"
									}];
									return false;
								}
							} else {
								validate151.errors = [{
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
							if (data.search_id !== void 0) {
								if (typeof data.search_id !== "string") {
									validate151.errors = [{
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
	validate151.errors = vErrors;
	return true;
}
validate151.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateChatSearchRequest };
