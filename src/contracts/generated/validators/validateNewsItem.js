// generated/raw-validators/validateNewsItem.js
var validateNewsItem = validate412;
function validate412(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate412.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.title === void 0 && (missing0 = "title") || data.url === void 0 && (missing0 = "url") || data.source === void 0 && (missing0 = "source") || data.published === void 0 && (missing0 = "published") || data.summary === void 0 && (missing0 = "summary")) {
			validate412.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "published" || key0 === "source" || key0 === "summary" || key0 === "title" || key0 === "url")) {
				validate412.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.published !== void 0) {
				if (typeof data.published !== "string") {
					validate412.errors = [{
						instancePath: instancePath + "/published",
						schemaPath: "#/properties/published/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.source !== void 0) {
					if (typeof data.source !== "string") {
						validate412.errors = [{
							instancePath: instancePath + "/source",
							schemaPath: "#/properties/source/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.summary !== void 0) {
						if (typeof data.summary !== "string") {
							validate412.errors = [{
								instancePath: instancePath + "/summary",
								schemaPath: "#/properties/summary/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.title !== void 0) {
							if (typeof data.title !== "string") {
								validate412.errors = [{
									instancePath: instancePath + "/title",
									schemaPath: "#/properties/title/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.url !== void 0) {
								if (typeof data.url !== "string") {
									validate412.errors = [{
										instancePath: instancePath + "/url",
										schemaPath: "#/properties/url/type",
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
		validate412.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate412.errors = vErrors;
	return true;
}
validate412.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateNewsItem };
