// generated/raw-validators/validateNewsSourceDiagnostic.js
var validateNewsSourceDiagnostic = validate471;
var schema605 = {
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
function validate471(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate471.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.provider === void 0 && (missing0 = "provider") || data.message === void 0 && (missing0 = "message")) {
			validate471.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "message" || key0 === "provider")) {
				validate471.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.message !== void 0) {
				if (typeof data.message !== "string") {
					validate471.errors = [{
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
				if (data.provider !== void 0) {
					let data1 = data.provider;
					if (typeof data1 !== "string") {
						validate471.errors = [{
							instancePath: instancePath + "/provider",
							schemaPath: "#/$defs/NewsProvider/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data1 === "auto" || data1 === "google_news_rss" || data1 === "ai_hot" || data1 === "free_news_trending" || data1 === "gdelt" || data1 === "bbc_technology" || data1 === "any_search" || data1 === "tavily" || data1 === "serper")) {
						validate471.errors = [{
							instancePath: instancePath + "/provider",
							schemaPath: "#/$defs/NewsProvider/enum",
							keyword: "enum",
							params: { allowedValues: schema605.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate471.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate471.errors = vErrors;
	return true;
}
validate471.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateNewsSourceDiagnostic };
