"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const core = require('@actions/core');
const github = require('@actions/github');
const parse = require('parse-diff');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // get information on everything
            const token = core.getInput('github-token', { required: true });
            const octokit = github.getOctokit(token);
            const context = github.context;
            console.log('context.payload.pull_request', context.payload.pull_request);
            // Request the pull request diff from the GitHub API
            const { data: prDiff } = yield octokit.pulls.get({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: context.payload.pull_request.number,
                mediaType: {
                    format: "diff",
                },
            });
            const files = parse(prDiff);
            // Get changed chunks
            var changes = '';
            var additions = 0;
            files.forEach(function (file) {
                additions += file.additions;
                file.chunks.forEach(function (chunk) {
                    chunk.changes.forEach(function (change) {
                        if (change.add) {
                            changes += change.content;
                        }
                    });
                });
            });
            // Check that the pull request diff does not contain the forbidden string
            const diffDoesNotContain = core.getInput('diffDoesNotContain');
            const diffDoesNotContainCount = parseInt(core.getInput('diffDoesNotContainCount') || 5, 10);
            if (diffDoesNotContain && changes.includes(diffDoesNotContain)) {
                const timesFound = (changes.match(new RegExp(diffDoesNotContain, "g")) || []).length;
                console.log('??', {
                    timesFound,
                    diffDoesNotContainCount
                });
                if (timesFound > diffDoesNotContainCount) {
                    core.setFailed("The PR diff should not include " + diffDoesNotContain);
                }
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
