import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateNewsSecretSetRequest.js
var validateNewsSecretSetRequest = validate405;
var schema524 = {
	"$defs": { "NewsProvider": {
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
	} },
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"description": "不派生 Debug，避免凭据进入日志；null 表示用户明确移除密钥。",
	"properties": {
		"api_key": {
			"maxLength": 2048,
			"type": ["string", "null"]
		},
		"data_generation_id": { "type": "string" },
		"provider": { "$ref": "#/$defs/NewsProvider" }
	},
	"required": ["data_generation_id", "provider"],
	"title": "NewsSecretSetRequest",
	"type": "object"
};
var schema525 = {
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
var func2 = require_ucs2length().default;
function validate405(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate405.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.provider === void 0 && (missing0 = "provider")) {
			validate405.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "api_key" || key0 === "data_generation_id" || key0 === "provider")) {
				validate405.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.api_key !== void 0) {
				let data0 = data.api_key;
				if (typeof data0 !== "string" && data0 !== null) {
					validate405.errors = [{
						instancePath: instancePath + "/api_key",
						schemaPath: "#/properties/api_key/type",
						keyword: "type",
						params: { type: schema524.properties.api_key.type },
						message: "must be string,null"
					}];
					return false;
				}
				if (typeof data0 === "string") {
					if (func2(data0) > 2048) {
						validate405.errors = [{
							instancePath: instancePath + "/api_key",
							schemaPath: "#/properties/api_key/maxLength",
							keyword: "maxLength",
							params: { limit: 2048 },
							message: "must NOT have more than 2048 characters"
						}];
						return false;
					}
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data_generation_id !== void 0) {
					if (typeof data.data_generation_id !== "string") {
						validate405.errors = [{
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
					if (data.provider !== void 0) {
						let data2 = data.provider;
						if (typeof data2 !== "string") {
							validate405.errors = [{
								instancePath: instancePath + "/provider",
								schemaPath: "#/$defs/NewsProvider/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "auto" || data2 === "google_news_rss" || data2 === "ai_hot" || data2 === "free_news_trending" || data2 === "gdelt" || data2 === "bbc_technology" || data2 === "any_search" || data2 === "tavily" || data2 === "serper")) {
							validate405.errors = [{
								instancePath: instancePath + "/provider",
								schemaPath: "#/$defs/NewsProvider/enum",
								keyword: "enum",
								params: { allowedValues: schema525.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate405.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate405.errors = vErrors;
	return true;
}
validate405.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateNewsSecretSetRequest };
