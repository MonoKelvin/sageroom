// generated/raw-validators/validateChatSendRequest.js
var validateChatSendRequest = validate186;
var schema243 = {
	"$defs": { "MessagePart": { "oneOf": [
		{
			"additionalProperties": false,
			"properties": {
				"kind": {
					"const": "text",
					"type": "string"
				},
				"text": { "type": "string" }
			},
			"required": ["kind", "text"],
			"type": "object"
		},
		{
			"additionalProperties": false,
			"properties": {
				"attachment_id": { "type": "string" },
				"kind": {
					"const": "attachment",
					"type": "string"
				}
			},
			"required": ["kind", "attachment_id"],
			"type": "object"
		},
		{
			"additionalProperties": false,
			"properties": {
				"emote_id": { "type": "string" },
				"kind": {
					"const": "emote",
					"type": "string"
				}
			},
			"required": ["kind", "emote_id"],
			"type": "object"
		}
	] } },
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"client_request_id": { "type": "string" },
		"data_generation_id": { "type": "string" },
		"mention_all": { "type": "boolean" },
		"mention_ids": {
			"items": { "type": "string" },
			"type": "array"
		},
		"parts": {
			"items": { "$ref": "#/$defs/MessagePart" },
			"type": "array"
		},
		"quote_message_id": {
			"default": null,
			"type": ["string", "null"]
		}
	},
	"required": [
		"data_generation_id",
		"client_request_id",
		"parts",
		"mention_ids",
		"mention_all"
	],
	"title": "ChatSendRequest",
	"type": "object"
};
function validate186(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate186.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.parts === void 0 && (missing0 = "parts") || data.mention_ids === void 0 && (missing0 = "mention_ids") || data.mention_all === void 0 && (missing0 = "mention_all")) {
				validate186.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "mention_all" || key0 === "mention_ids" || key0 === "parts" || key0 === "quote_message_id")) {
					validate186.errors = [{
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
							validate186.errors = [{
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
								validate186.errors = [{
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
							if (data.mention_all !== void 0) {
								const _errs6 = errors;
								if (typeof data.mention_all !== "boolean") {
									validate186.errors = [{
										instancePath: instancePath + "/mention_all",
										schemaPath: "#/properties/mention_all/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.mention_ids !== void 0) {
									let data3 = data.mention_ids;
									const _errs8 = errors;
									if (errors === _errs8) {
										if (Array.isArray(data3)) {
											const len0 = data3.length;
											for (let i0 = 0; i0 < len0; i0++) {
												const _errs10 = errors;
												if (typeof data3[i0] !== "string") {
													validate186.errors = [{
														instancePath: instancePath + "/mention_ids/" + i0,
														schemaPath: "#/properties/mention_ids/items/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												if (!(_errs10 === errors)) break;
											}
										} else {
											validate186.errors = [{
												instancePath: instancePath + "/mention_ids",
												schemaPath: "#/properties/mention_ids/type",
												keyword: "type",
												params: { type: "array" },
												message: "must be array"
											}];
											return false;
										}
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.parts !== void 0) {
										let data5 = data.parts;
										const _errs12 = errors;
										if (errors === _errs12) {
											if (Array.isArray(data5)) {
												const len1 = data5.length;
												for (let i1 = 0; i1 < len1; i1++) {
													let data6 = data5[i1];
													const _errs14 = errors;
													const _errs16 = errors;
													let valid4 = false;
													let passing0 = null;
													const _errs17 = errors;
													if (errors === _errs17) {
														if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
															let missing1;
															if (data6.kind === void 0 && (missing1 = "kind") || data6.text === void 0 && (missing1 = "text")) {
																const err0 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/0/required",
																	keyword: "required",
																	params: { missingProperty: missing1 },
																	message: "must have required property '" + missing1 + "'"
																};
																if (vErrors === null) vErrors = [err0];
																else vErrors.push(err0);
																errors++;
															} else {
																const _errs19 = errors;
																for (const key1 in data6) if (!(key1 === "kind" || key1 === "text")) {
																	const err1 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/0/additionalProperties",
																		keyword: "additionalProperties",
																		params: { additionalProperty: key1 },
																		message: "must NOT have additional properties"
																	};
																	if (vErrors === null) vErrors = [err1];
																	else vErrors.push(err1);
																	errors++;
																	break;
																}
																if (_errs19 === errors) {
																	if (data6.kind !== void 0) {
																		let data7 = data6.kind;
																		const _errs20 = errors;
																		if (typeof data7 !== "string") {
																			const err2 = {
																				instancePath: instancePath + "/parts/" + i1 + "/kind",
																				schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err2];
																			else vErrors.push(err2);
																			errors++;
																		}
																		if ("text" !== data7) {
																			const err3 = {
																				instancePath: instancePath + "/parts/" + i1 + "/kind",
																				schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/const",
																				keyword: "const",
																				params: { allowedValue: "text" },
																				message: "must be equal to constant"
																			};
																			if (vErrors === null) vErrors = [err3];
																			else vErrors.push(err3);
																			errors++;
																		}
																		var valid5 = _errs20 === errors;
																	} else var valid5 = true;
																	if (valid5) {
																		if (data6.text !== void 0) {
																			const _errs22 = errors;
																			if (typeof data6.text !== "string") {
																				const err4 = {
																					instancePath: instancePath + "/parts/" + i1 + "/text",
																					schemaPath: "#/$defs/MessagePart/oneOf/0/properties/text/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err4];
																				else vErrors.push(err4);
																				errors++;
																			}
																			var valid5 = _errs22 === errors;
																		} else var valid5 = true;
																	}
																}
															}
														} else {
															const err5 = {
																instancePath: instancePath + "/parts/" + i1,
																schemaPath: "#/$defs/MessagePart/oneOf/0/type",
																keyword: "type",
																params: { type: "object" },
																message: "must be object"
															};
															if (vErrors === null) vErrors = [err5];
															else vErrors.push(err5);
															errors++;
														}
													}
													var _valid0 = _errs17 === errors;
													if (_valid0) {
														valid4 = true;
														passing0 = 0;
														var props0 = true;
													}
													const _errs24 = errors;
													if (errors === _errs24) {
														if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
															let missing2;
															if (data6.kind === void 0 && (missing2 = "kind") || data6.attachment_id === void 0 && (missing2 = "attachment_id")) {
																const err6 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/1/required",
																	keyword: "required",
																	params: { missingProperty: missing2 },
																	message: "must have required property '" + missing2 + "'"
																};
																if (vErrors === null) vErrors = [err6];
																else vErrors.push(err6);
																errors++;
															} else {
																const _errs26 = errors;
																for (const key2 in data6) if (!(key2 === "attachment_id" || key2 === "kind")) {
																	const err7 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/1/additionalProperties",
																		keyword: "additionalProperties",
																		params: { additionalProperty: key2 },
																		message: "must NOT have additional properties"
																	};
																	if (vErrors === null) vErrors = [err7];
																	else vErrors.push(err7);
																	errors++;
																	break;
																}
																if (_errs26 === errors) {
																	if (data6.attachment_id !== void 0) {
																		const _errs27 = errors;
																		if (typeof data6.attachment_id !== "string") {
																			const err8 = {
																				instancePath: instancePath + "/parts/" + i1 + "/attachment_id",
																				schemaPath: "#/$defs/MessagePart/oneOf/1/properties/attachment_id/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err8];
																			else vErrors.push(err8);
																			errors++;
																		}
																		var valid6 = _errs27 === errors;
																	} else var valid6 = true;
																	if (valid6) {
																		if (data6.kind !== void 0) {
																			let data10 = data6.kind;
																			const _errs29 = errors;
																			if (typeof data10 !== "string") {
																				const err9 = {
																					instancePath: instancePath + "/parts/" + i1 + "/kind",
																					schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err9];
																				else vErrors.push(err9);
																				errors++;
																			}
																			if ("attachment" !== data10) {
																				const err10 = {
																					instancePath: instancePath + "/parts/" + i1 + "/kind",
																					schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/const",
																					keyword: "const",
																					params: { allowedValue: "attachment" },
																					message: "must be equal to constant"
																				};
																				if (vErrors === null) vErrors = [err10];
																				else vErrors.push(err10);
																				errors++;
																			}
																			var valid6 = _errs29 === errors;
																		} else var valid6 = true;
																	}
																}
															}
														} else {
															const err11 = {
																instancePath: instancePath + "/parts/" + i1,
																schemaPath: "#/$defs/MessagePart/oneOf/1/type",
																keyword: "type",
																params: { type: "object" },
																message: "must be object"
															};
															if (vErrors === null) vErrors = [err11];
															else vErrors.push(err11);
															errors++;
														}
													}
													var _valid0 = _errs24 === errors;
													if (_valid0 && valid4) {
														valid4 = false;
														passing0 = [passing0, 1];
													} else {
														if (_valid0) {
															valid4 = true;
															passing0 = 1;
															if (props0 !== true) props0 = true;
														}
														const _errs31 = errors;
														if (errors === _errs31) {
															if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
																let missing3;
																if (data6.kind === void 0 && (missing3 = "kind") || data6.emote_id === void 0 && (missing3 = "emote_id")) {
																	const err12 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/2/required",
																		keyword: "required",
																		params: { missingProperty: missing3 },
																		message: "must have required property '" + missing3 + "'"
																	};
																	if (vErrors === null) vErrors = [err12];
																	else vErrors.push(err12);
																	errors++;
																} else {
																	const _errs33 = errors;
																	for (const key3 in data6) if (!(key3 === "emote_id" || key3 === "kind")) {
																		const err13 = {
																			instancePath: instancePath + "/parts/" + i1,
																			schemaPath: "#/$defs/MessagePart/oneOf/2/additionalProperties",
																			keyword: "additionalProperties",
																			params: { additionalProperty: key3 },
																			message: "must NOT have additional properties"
																		};
																		if (vErrors === null) vErrors = [err13];
																		else vErrors.push(err13);
																		errors++;
																		break;
																	}
																	if (_errs33 === errors) {
																		if (data6.emote_id !== void 0) {
																			const _errs34 = errors;
																			if (typeof data6.emote_id !== "string") {
																				const err14 = {
																					instancePath: instancePath + "/parts/" + i1 + "/emote_id",
																					schemaPath: "#/$defs/MessagePart/oneOf/2/properties/emote_id/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err14];
																				else vErrors.push(err14);
																				errors++;
																			}
																			var valid7 = _errs34 === errors;
																		} else var valid7 = true;
																		if (valid7) {
																			if (data6.kind !== void 0) {
																				let data12 = data6.kind;
																				const _errs36 = errors;
																				if (typeof data12 !== "string") {
																					const err15 = {
																						instancePath: instancePath + "/parts/" + i1 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/type",
																						keyword: "type",
																						params: { type: "string" },
																						message: "must be string"
																					};
																					if (vErrors === null) vErrors = [err15];
																					else vErrors.push(err15);
																					errors++;
																				}
																				if ("emote" !== data12) {
																					const err16 = {
																						instancePath: instancePath + "/parts/" + i1 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/const",
																						keyword: "const",
																						params: { allowedValue: "emote" },
																						message: "must be equal to constant"
																					};
																					if (vErrors === null) vErrors = [err16];
																					else vErrors.push(err16);
																					errors++;
																				}
																				var valid7 = _errs36 === errors;
																			} else var valid7 = true;
																		}
																	}
																}
															} else {
																const err17 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/2/type",
																	keyword: "type",
																	params: { type: "object" },
																	message: "must be object"
																};
																if (vErrors === null) vErrors = [err17];
																else vErrors.push(err17);
																errors++;
															}
														}
														var _valid0 = _errs31 === errors;
														if (_valid0 && valid4) {
															valid4 = false;
															passing0 = [passing0, 2];
														} else if (_valid0) {
															valid4 = true;
															passing0 = 2;
															if (props0 !== true) props0 = true;
														}
													}
													if (!valid4) {
														const err18 = {
															instancePath: instancePath + "/parts/" + i1,
															schemaPath: "#/$defs/MessagePart/oneOf",
															keyword: "oneOf",
															params: { passingSchemas: passing0 },
															message: "must match exactly one schema in oneOf"
														};
														if (vErrors === null) vErrors = [err18];
														else vErrors.push(err18);
														errors++;
														validate186.errors = vErrors;
														return false;
													} else {
														errors = _errs16;
														if (vErrors !== null) {
															if (_errs16) vErrors.length = _errs16;
															else vErrors = null;
														}
													}
													if (!(_errs14 === errors)) break;
												}
											} else {
												validate186.errors = [{
													instancePath: instancePath + "/parts",
													schemaPath: "#/properties/parts/type",
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
										if (data.quote_message_id !== void 0) {
											let data13 = data.quote_message_id;
											const _errs38 = errors;
											if (typeof data13 !== "string" && data13 !== null) {
												validate186.errors = [{
													instancePath: instancePath + "/quote_message_id",
													schemaPath: "#/properties/quote_message_id/type",
													keyword: "type",
													params: { type: schema243.properties.quote_message_id.type },
													message: "must be string,null"
												}];
												return false;
											}
											var valid0 = _errs38 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate186.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate186.errors = vErrors;
	return errors === 0;
}
validate186.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateChatSendRequest };
